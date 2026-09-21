const { ObjectId } = require('mongodb');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const config = require('../../../shared/config/setting');
const DatabaseConnection = require('../../../shared/database/database');

const s3Client = new S3Client({ region: config.aws.region });

function getRequiredS3Config() {
    if (!config.aws.region || !config.aws.s3Bucket) {
        throw new Error("Missing AWS S3 config: AWS_REGION and AWS_S3_BUCKET are required");
    }
    return {
        region: config.aws.region,
        bucket: config.aws.s3Bucket,
    };
}

function encodeS3Key(key) {
    return key.split("/").map(encodeURIComponent).join("/");
}

function sanitizeFolderPart(value) {
    return String(value || "").replace(/[\\/]+/g, "-").trim();
}

class FlashcardImageService {
    constructor() {
        const client = DatabaseConnection.getMongoClient();
        const db = client.db(config.mongodb.database);
        this.usersCollection = db.collection("users");
        this.baseFolder = "easytalk/flashcard";
    }

    async getUsername(userId) {
        if(!userId) return null;
        const user = await this.usersCollection.findOne({ _id: new ObjectId(userId) });
        return user?.username;
    }

    extractPublicIdFromUrl(url) {
        try {
            if (!url) return null;
            const parsed = new URL(url);
            const base = decodeURIComponent(parsed.pathname).split("/").pop();
            return base ? base.split(".")[0] : null;
        } catch (err) {
            const match = url.match(/\/([^\/\?]+)(?:\.[^\/\?]+)?$/);
            return match ? match[1] : null;
        }
    }

    buildPublicUrl(key) {
        const { region, bucket } = getRequiredS3Config();
        return `https://${bucket}.s3.${region}.amazonaws.com/${encodeS3Key(key)}`;
    }

    async uploadBuffer(fileBuffer, key, contentType = "image/jpeg") {
        const { bucket } = getRequiredS3Config();
        await s3Client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: fileBuffer,
            ContentType: contentType,
            CacheControl: "public, max-age=0, must-revalidate",
        }));
        return this.buildPublicUrl(key);
    }

    async uploadNewImage(fileBuffer, userId) {
        if(!fileBuffer || !userId) return null;
        const username = await this.getUsername(userId);
        if(!username) throw new Error("User not found");
        const folder = `${this.baseFolder}/${sanitizeFolderPart(username)}`;
        const publicId = `flashcard-${Date.now()}`;
        return this.uploadBuffer(fileBuffer, `${folder}/${publicId}`);
    }

    async uploadReplacementImage(fileBuffer, existingImageUrl, userId) {
        if(!fileBuffer || !existingImageUrl || !userId) return null;
        const username = await this.getUsername(userId);
        if(!username) throw new Error("User not found");
        const folder = `${this.baseFolder}/${sanitizeFolderPart(username)}`;
        const publicId = this.extractPublicIdFromUrl(existingImageUrl);
        if(!publicId) throw new Error("Invalid image URL");
        return this.uploadBuffer(fileBuffer, `${folder}/${publicId}`);
    }

    async deleteImage(imageUrl, userId) {
        if(!imageUrl || !userId) return;
        const username = await this.getUsername(userId);
        const publicId = this.extractPublicIdFromUrl(imageUrl);
        if(publicId && username) {
            const key = `${this.baseFolder}/${sanitizeFolderPart(username)}/${publicId}`;
            try {
                const { bucket } = getRequiredS3Config();
                await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
            } catch (err) {
                console.warn("Không thể xóa ảnh S3:", err.message);
            }
        }
    }

    async deleteMultipleImages(flashcards, userId) {
        const username = await this.getUsername(userId);
        if(!username) return;
        for(let flashcard of flashcards) {
            if(flashcard.image) {
                const publicId = this.extractPublicIdFromUrl(flashcard.image);
                if(publicId) {
                    const key = `${this.baseFolder}/${sanitizeFolderPart(username)}/${publicId}`;
                    try {
                        const { bucket } = getRequiredS3Config();
                        await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
                    } catch (err) {
                        console.warn("Không thể xóa ảnh S3:", err.message);
                    }
                }
            }
        }
    }
}

module.exports = FlashcardImageService;
