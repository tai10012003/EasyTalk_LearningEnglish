const path = require("path");
const config = require("../../../shared/config/setting")
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
    cloud_name: config.cloudiary.name,
    api_key: config.cloudiary.key,
    api_secret: config.cloudiary.secret,
});

class ImageUploadService {
    constructor(cloudFolder) {
        this.cloudFolder = cloudFolder;
    }

    extractPublicIdFromUrl(url) {
        try {
            if (!url) return null;
            const folderName = this.cloudFolder.split('/').pop();
            const pattern = new RegExp(`/${this.cloudFolder}/([^\\.\/\\?]+)`);
            const m = url.match(pattern);
            if (m && m[1]) return m[1];
            const base = path.basename(url).split(".")[0];
            return base;
        } catch (err) {
            return null;
        }
    }

    async getNextPublicId(repository, prefix) {
        try {
            const pattern = `${prefix}-\\d+`;
            const docs = await repository.findImagesWithPattern(pattern);
            const nums = [];
            docs.forEach((d) => {
                if (d.images) {
                    const regex = new RegExp(`${prefix}-(\\d+)`);
                    const m = ("" + d.images).match(regex);
                    if (m && m[1]) nums.push(parseInt(m[1], 10));
                }
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
        } catch (err) {
            return `${prefix}-${Date.now()}`;
        }
    }

    async uploadNewImage(file, publicIdBase) {
        if (!file) return null;
        return await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    public_id: publicIdBase,
                    folder: this.cloudFolder,
                    overwrite: true,
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                }
            );
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }

    async uploadReplacementImage(file, existingPublicId) {
        if (!file) return null;
        return await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    public_id: existingPublicId,
                    folder: this.cloudFolder,
                    overwrite: true,
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result.secure_url);
                }
            );
            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }

    async deleteImage(publicId) {
        try {
            await cloudinary.uploader.destroy(`${this.cloudFolder}/${publicId}`);
            return true;
        } catch (err) {
            console.warn("Không thể xóa ảnh Cloudinary:", err.message);
            return false;
        }
    }
}

module.exports = ImageUploadService;