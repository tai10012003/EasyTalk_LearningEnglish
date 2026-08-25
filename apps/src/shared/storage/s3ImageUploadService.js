const path = require("path");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const config = require("../config/setting");

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

class S3ImageUploadService {
    constructor(folderPrefix) {
        this.folderPrefix = folderPrefix;
    }

    buildObjectKey(publicId) {
        return `${this.folderPrefix}/${publicId}`;
    }

    buildPublicUrl(key) {
        const { region, bucket } = getRequiredS3Config();
        return `https://${bucket}.s3.${region}.amazonaws.com/${encodeS3Key(key)}`;
    }

    extractPublicIdFromUrl(url) {
        try {
            if (!url) return null;
            const parsed = new URL(url);
            const decodedPath = decodeURIComponent(parsed.pathname);
            const pattern = new RegExp(`/${this.folderPrefix}/([^\\.\\/\\?]+)`);
            const match = decodedPath.match(pattern);
            if (match && match[1]) return match[1];
            return path.basename(decodedPath).split(".")[0];
        } catch {
            try {
                return path.basename(url).split(".")[0];
            } catch {
                return null;
            }
        }
    }

    async getNextPublicId(repository, prefix) {
        try {
            const pattern = `${prefix}-\\d+`;
            const docs = await repository.findImagesWithPattern(pattern);
            const nums = [];
            docs.forEach((doc) => {
                const imageValue = doc.images || doc.image;
                if (!imageValue) return;
                const regex = new RegExp(`${prefix}-(\\d+)`);
                const match = String(imageValue).match(regex);
                if (match && match[1]) nums.push(parseInt(match[1], 10));
            });
            nums.sort((a, b) => a - b);
            let next = 1;
            for (let i = 0; i < nums.length; i++) {
                if (nums[i] !== i + 1) {
                    next = i + 1;
                    break;
                }
                next = nums.length + 1;
            }
            return `${prefix}-${next}`;
        } catch {
            return `${prefix}-${Date.now()}`;
        }
    }

    async uploadBuffer(buffer, publicId, contentType = "image/jpeg") {
        if (!buffer) return null;
        const { bucket } = getRequiredS3Config();
        const key = this.buildObjectKey(publicId);
        await s3Client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
            CacheControl: "public, max-age=0, must-revalidate",
        }));
        return this.buildPublicUrl(key);
    }

    async uploadNewImage(file, publicIdBase) {
        if (!file) return null;
        return this.uploadBuffer(file.buffer, publicIdBase, file.mimetype || "image/jpeg");
    }

    async uploadReplacementImage(file, existingPublicId) {
        if (!file) return null;
        return this.uploadBuffer(file.buffer, existingPublicId, file.mimetype || "image/jpeg");
    }

    async deleteImage(publicId) {
        try {
            const { bucket } = getRequiredS3Config();
            await s3Client.send(new DeleteObjectCommand({
                Bucket: bucket,
                Key: this.buildObjectKey(publicId),
            }));
            return true;
        } catch (error) {
            console.warn("Không thể xóa ảnh S3:", error.message);
            return false;
        }
    }
}

module.exports = S3ImageUploadService;
