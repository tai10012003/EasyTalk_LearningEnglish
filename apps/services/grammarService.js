const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { GrammarRepository } = require("./../repositories");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

class GrammarsService {
    constructor() {
        this.grammarRepository = new GrammarRepository();
        this.cloudFolder = "easytalk/grammar";
    }

    async getGrammarList(page = 1, limit = 12, search = "", role = "user") {
        const skip = (page - 1) * limit;
        const filter = {};
        if (role !== "admin") {
            filter.display = true;
        }
        if (search) filter.title = { $regex: search, $options: "i" };
        const { grammars, total } = await this.grammarRepository.findAll(filter, skip, limit);
        return { grammars, totalGrammars: total };
    }

    async getGrammar(id) {
        return await this.grammarRepository.findById(id);
    }

    async getGrammarBySlug(slug) {
        return await this.grammarRepository.findBySlug(slug);
    }

    async insertGrammar(grammar, file = null) {
        let imageUrl = null;
        if (file) {
            imageUrl = await this.uploadNewImage(file);
        } else if (grammar.images) {
            imageUrl = grammar.images;
        }
        const newGrammar = {
            title: grammar.title,
            description: grammar.description,
            content: grammar.content,
            images: imageUrl,
            quizzes: [],
            slug: grammar.slug,
            sort: grammar.sort,
            display: grammar.display,
            createdAt: new Date()
        };
        if (grammar.quizzes && Array.isArray(grammar.quizzes)) {
            grammar.quizzes.forEach(question => {
                newGrammar.quizzes.push({
                    question: question.question,
                    type: question.type,
                    correctAnswer: question.correctAnswer,
                    explanation: question.explanation || "",
                    options: question.options || []
                });
            });
        }
        return await this.grammarRepository.insert(newGrammar);
    }

    async updateGrammar(id, grammar, file = null) {
        const formattedQuestions = grammar.quizzes.map(q => ({
            question: q.question,
            type: q.type,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            options: q.options || []
        }));
        const existing = await this.getGrammar(id);
        let imageUrl = existing && existing.images ? existing.images : (grammar.images || "");
        if (file) {
            const existingPublicId = existing && existing.images ? this._extractPublicIdFromUrl(existing.images) : null;
            if (existingPublicId) {
                imageUrl = await this.uploadReplacementImage(file, existingPublicId);
            } else {
                imageUrl = await this.uploadNewImage(file);
            }
        }
        const updateData = {
            title: grammar.title.trim(),
            description: grammar.description.trim(),
            content: grammar.content.trim(),
            images: imageUrl,
            quizzes: formattedQuestions,
            slug: grammar.slug,
            sort: grammar.sort,
            display: grammar.display,
            updatedAt: new Date()
        };
        return await this.grammarRepository.update(id, updateData);
    }

    async deleteGrammar(id) {
        const existing = await this.getGrammar(id);
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
        return await this.grammarRepository.delete(id);
    }

    _extractPublicIdFromUrl(url) {
        try {
            if (!url) return null;
            const m = url.match(/\/easytalk\/grammar\/([^\.\/\?]+)/);
            if (m && m[1]) return m[1];
            const base = path.basename(url).split(".")[0];
            return base;
        } catch (err) {
            return null;
        }
    }

    async _getNextGrammarPublicId() {
        try {
            const coll = this.grammarRepository.collection;
            const cursor = await coll.find({ images: { $regex: "grammar-\\d+" } }, { projection: { images: 1 } });
            const docs = await cursor.toArray();
            const nums = [];
            docs.forEach((d) => {
                if (d.images) {
                    const m = ("" + d.images).match(/grammar-(\d+)/);
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
            return `grammar-${next}`;
        } catch (err) {
            return `grammar-${Date.now()}`;
        }
    }

    async uploadNewImage(file) {
        if (!file) return null;
        const ext = path.extname(file.originalname) || ".jpg";
        const publicIdBase = await this._getNextGrammarPublicId();
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

module.exports = GrammarsService;