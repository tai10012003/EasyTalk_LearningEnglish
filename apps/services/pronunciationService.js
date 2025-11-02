const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { PronunciationRepository } = require("./../repositories");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

class PronunciationsService {
    constructor() {
        this.pronunciationRepository = new PronunciationRepository();
        this.cloudFolder = "easytalk/pronunciation";
    }
    async getPronunciationList(page = 1, limit = 12, role = "user") {
        const skip = (page - 1) * limit;
        const filter = {};
        if (role !== "admin") {
            filter.display = true;
        }
        const { items, total } = await this.pronunciationRepository.findAll(filter, skip, limit);
        return {
            pronunciations: items,
            totalPronunciations: total
        };
    }

    async getPronunciation(id) {
        return await this.pronunciationRepository.findById(id);
    }

    async getPronunciationBySlug(slug) {
        return await this.pronunciationRepository.findBySlug(slug);
    }

    async insertPronunciation(pronunciation, file = null) {
        let imageUrl = null;
        if (file) {
            imageUrl = await this.uploadNewImage(file);
        } else if (pronunciation.images) {
            imageUrl = pronunciation.images;
        }
        const newPronunciation = {
            title: pronunciation.title,
            description: pronunciation.description,
            content: pronunciation.content,
            images: imageUrl,
            quizzes: [],
            slug: pronunciation.slug,
            sort: pronunciation.sort,
            display: pronunciation.display,
            createdAt: new Date()
        };
        if (pronunciation.quizzes && Array.isArray(pronunciation.quizzes)) {
            pronunciation.quizzes.forEach(question => {
                newPronunciation.quizzes.push({
                    question: question.question,
                    type: question.type,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation || "",
                    options: question.options || []
                });
            });
        }
        return await this.pronunciationRepository.insert(newPronunciation);
    }

    async updatePronunciation(id, pronunciation, file = null) {
        const formattedQuestions = pronunciation.quizzes.map(q => ({
            question: q.question,
            type: q.type,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            options: q.options || []
        }));
        const existing = await this.getPronunciation(id);
        let imageUrl = existing && existing.images ? existing.images : (pronunciation.images || "");
        if (file) {
            const existingPublicId = existing && existing.images ? this._extractPublicIdFromUrl(existing.images) : null;
            if (existingPublicId) {
                imageUrl = await this.uploadReplacementImage(file, existingPublicId);
            } else {
                imageUrl = await this.uploadNewImage(file);
            }
        }
        const updateData = {
            title: pronunciation.title.trim(),
            description: pronunciation.description.trim(),
            content: pronunciation.content.trim(),
            images: imageUrl,
            quizzes: formattedQuestions,
            slug: pronunciation.slug,
            sort: pronunciation.sort,
            display: pronunciation.display,
            updatedAt: new Date()
        };
        return await this.pronunciationRepository.update(id, updateData);
    }

    async deletePronunciation(id) {
        const existing = await this.getPronunciation(id);
            if (existing && existing.images) {
            const publicId = this._extractPublicIdFromUrl(existing.images);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(`${this.cloudFolder}/${publicId}`);
                } catch (err) {
                    console.warn("Không thể xóa ảnh Cloudinary:", err.message);
                }
            }
        }
        return await this.pronunciationRepository.delete(id);
    }

    _extractPublicIdFromUrl(url) {
        try {
            if (!url) return null;
            const m = url.match(/\/easytalk\/pronunciation\/([^\.\/\?]+)/);
            if (m && m[1]) return m[1];
            const base = path.basename(url).split(".")[0];
            return base;
        } catch (err) {
            return null;
        }
    }

    async _getNextPronunciationPublicId() {
        try {
            const coll = this.pronunciationRepository.collection;
            const cursor = await coll.find({ images: { $regex: "pronunciation-\\d+" } }, { projection: { images: 1 } });
            const docs = await cursor.toArray();
            const nums = [];
            docs.forEach((d) => {
                if (d.images) {
                    const m = ("" + d.images).match(/pronunciation-(\d+)/);
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
            return `pronunciation-${next}`;
        } catch (err) {
            return `pronunciation-${Date.now()}`;
        }
    }

    async uploadNewImage(file) {
        if (!file) return null;
        const ext = path.extname(file.originalname) || ".jpg";
        const publicIdBase = await this._getNextPronunciationPublicId();
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
}

module.exports = PronunciationsService;