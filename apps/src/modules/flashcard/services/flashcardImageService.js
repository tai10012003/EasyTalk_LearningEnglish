const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { ObjectId } = require('mongodb');
const config = require('../../../shared/config/setting');
const DatabaseConnection = require('../../../shared/database/database');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
            const match = url.match(/\/([^\/\?]+)\.[^\/\?]+$/);
            return match ? match[1] : null;
        } catch (err) {
            return null;
        }
    }

    async uploadNewImage(fileBuffer, userId) {
        if(!fileBuffer || !userId) return null;
        const username = await this.getUsername(userId);
        if(!username) throw new Error("User not found");
        const folder = `${this.baseFolder}/${username}`;
        const publicId = `flashcard-${Date.now()}`;
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    public_id: publicId,
                    folder: folder,
                    overwrite: true,
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                }
            );
            streamifier.createReadStream(fileBuffer).pipe(uploadStream);
        });
    }

    async uploadReplacementImage(fileBuffer, existingImageUrl, userId) {
        if(!fileBuffer || !existingImageUrl || !userId) return null;
        const username = await this.getUsername(userId);
        if(!username) throw new Error("User not found");
        const folder = `${this.baseFolder}/${username}`;
        const publicId = this.extractPublicIdFromUrl(existingImageUrl);
        if(!publicId) throw new Error("Invalid image URL");
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    public_id: publicId,
                    folder: folder,
                    overwrite: true,
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                }
            );
            streamifier.createReadStream(fileBuffer).pipe(uploadStream);
        });
    }

    async deleteImage(imageUrl, userId) {
        if(!imageUrl || !userId) return;
        const username = await this.getUsername(userId);
        const publicId = this.extractPublicIdFromUrl(imageUrl);
        if(publicId && username) {
            const fullPublicId = `${this.baseFolder}/${username}/${publicId}`;
            try {
                await cloudinary.uploader.destroy(fullPublicId);
            } catch (err) {
                console.warn("Không thể xóa ảnh Cloudinary:", err.message);
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
                    const fullPublicId = `${this.baseFolder}/${username}/${publicId}`;
                    try {
                        await cloudinary.uploader.destroy(fullPublicId);
                    } catch (err) {
                        console.warn("Không thể xóa ảnh Cloudinary:", err.message);
                    }
                }
            }
        }
    }
}

module.exports = FlashcardImageService;