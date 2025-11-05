const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { StoryRepository } = require("./../repositories");
const { getRedisClient } = require('../util/redisClient');

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
        const redis = getRedisClient();
        const cacheKey = `story:list:page=${page}:limit=${limit}:category=${category}:level=${level}:search=${search}:role=${role}`;
        const ttl = 300;
        try {
            const cached = await redis.get(cacheKey);
            if (cached) {
                console.log(`Direct cache hit: ${cacheKey}`);
                return JSON.parse(cached);
            }
        } catch (err) {
            console.error('Direct cache get error:', err);
        }
        const skip = (page - 1) * limit;
        const filter = {};
        if (role !== "admin") {
            filter.display = true;
        }
        if (category) filter.category = category;
        if (level) filter.level = level;
        if (search) filter.title = { $regex: search, $options: "i" };

        const { stories, total } = await this.storyRepository.findAll(filter, skip, limit);
        const result = { stories, totalStory: total };
        try {
            await redis.setex(cacheKey, ttl, JSON.stringify(result));
            console.log(`Direct cache set: ${cacheKey}`);
        } catch (err) {
            console.error('Direct cache set error:', err);
        }
        return result;
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
        const result = await this.storyRepository.insert(newStory);
        await this._invalidateCache();
        return result;
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
        const result = await this.storyRepository.update(_id, updateFields);
        await this._invalidateCache();
        return result;
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
        const result = await this.storyRepository.delete(id);
        await this._invalidateCache();
        return result;
    }

    async _invalidateCache() {
        const redis = getRedisClient();
        const scanAndDelete = async (pattern) => {
            let cursor = '0';
            let totalDeleted = 0;
            do {
                const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                if (keys.length > 0) {
                    const deleted = await redis.del(keys);
                    totalDeleted += deleted;
                }
                cursor = nextCursor;
            } while (cursor !== '0');
            return totalDeleted;
        };
        try {
            const deletedList = await scanAndDelete('story:list:*');
            const deletedItem = await scanAndDelete('story:item:*');
            const deletedApi = await scanAndDelete('cache:/api/story*');
            const total = deletedList + deletedItem + deletedApi;
            if (total > 0) {
                console.log(`Story cache invalidated (${total} keys deleted)`);
            } else {
                console.log('No story cache keys found to invalidate.');
            }
        } catch (err) {
            console.error('Invalidate story cache error:', err);
        }
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