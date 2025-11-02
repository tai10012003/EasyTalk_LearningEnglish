const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { StoryRepository } = require("./../repositories");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

class StoryService {
    constructor() {
        this.storyRepository = new StoryRepository();
        this.cloudFolder = "easytalk/story";
    }

    async getStoryList(page = 1, limit = 12, category = "", level = "", search = "", role = "user") {
        const skip = (page - 1) * limit;
        const filter = {};
        if (role !== "admin") {
            filter.display = true;
        }
        if (category) filter.category = category;
        if (level) filter.level = level;
        if (search) filter.title = { $regex: search, $options: "i" };

        const { stories, total } = await this.storyRepository.findAll(filter, skip, limit);
        return { stories, totalStory: total };
    }

    async getStory(id) {
        return await this.storyRepository.findById(id);
    }

    async getStoryBySlug(slug) {
        return await this.storyRepository.findBySlug(slug);
    }

    async insertStory(storyData, file = null) {
        let imageUrl = null;
        if (file) {
            imageUrl = await this.uploadNewImage(file);
        } else if (storyData.image) {
            imageUrl = storyData.image;
        }
        const newStory = {
            title: storyData.title,
            description: storyData.description,
            level: storyData.level,
            category: storyData.category,
            image: imageUrl,
            content: [],
            slug: storyData.slug,
            sort: storyData.sort,
            display: storyData.display,
            createdAt: new Date()
        };
        if (storyData.content && Array.isArray(storyData.content)) {
            storyData.content.forEach(sentence => {
                const sentenceObj = {
                    en: sentence.en,
                    vi: sentence.vi,
                    vocabulary: sentence.vocabulary || [],
                    quiz: sentence.quiz
                        ? {
                              question: sentence.quiz.question,
                              type: sentence.quiz.type,
                              answer: sentence.quiz.answer,
                              explanation: sentence.quiz.explanation || '',
                              options: sentence.quiz.options || []
                          }
                        : null
                };
                newStory.content.push(sentenceObj);
            });
        }
        return await this.storyRepository.insert(newStory);
    }

    async updateStory(storyData, file = null) {
        const { _id, ...updateFields } = storyData;
        const existing = await this.getStory(_id);
        if (!existing) throw new Error("Story not found");
        if (updateFields.content && Array.isArray(updateFields.content)) {
            updateFields.content = updateFields.content.map(sentence => ({
                en: sentence.en,
                vi: sentence.vi,
                vocabulary: sentence.vocabulary || [],
                quiz: sentence.quiz
                    ? {
                        question: sentence.quiz.question,
                        type: sentence.quiz.type,
                        answer: sentence.quiz.answer,
                        explanation: sentence.quiz.explanation || '',
                        options: sentence.quiz.options || []
                    }
                    : null
            }));
        }
        let imageUrl = existing.image || updateFields.image || "";
        if (file) {
            const existingPublicId = existing && existing.image ? this._extractPublicIdFromUrl(existing.image) : null;
            if (existingPublicId) {
                imageUrl = await this.uploadReplacementImage(file, existingPublicId);
            } else {
                imageUrl = await this.uploadNewImage(file);
            }
        }
        updateFields.image = imageUrl;
        updateFields.updatedAt = new Date();
        return await this.storyRepository.update(_id, updateFields);
    }

    async deleteStory(id) {
        const existing = await this.getStory(id);
            if (existing && existing.image) {
            const publicId = this._extractPublicIdFromUrl(existing.image);
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(`${this.cloudFolder}/${publicId}`);
                } catch (err) {
                    console.warn("Không thể xóa ảnh Cloudinary:", err.message);
                }
            }
        }
        return await this.storyRepository.delete(id);
    }

    _extractPublicIdFromUrl(url) {
        try {
            if (!url) return null;
            const m = url.match(/\/easytalk\/story\/([^\.\/\?]+)/);
            if (m && m[1]) return m[1];
            const base = path.basename(url).split(".")[0];
            return base;
        } catch (err) {
            return null;
        }
    }

    async _getNextStoryPublicId() {
        try {
            const coll = this.storyRepository.collection;
            const cursor = await coll.find({ image: { $regex: "story-\\d+" } }, { projection: { image: 1 } });
            const docs = await cursor.toArray();
            const nums = [];
            docs.forEach((d) => {
                if (d.image) {
                    const m = ("" + d.image).match(/story-(\d+)/);
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
            return `story-${next}`;
        } catch (err) {
            return `story-${Date.now()}`;
        }
    }

    async uploadNewImage(file) {
        if (!file) return null;
        const ext = path.extname(file.originalname) || ".jpg";
        const publicIdBase = await this._getNextStoryPublicId();
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

module.exports = StoryService;