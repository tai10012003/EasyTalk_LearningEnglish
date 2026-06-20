const cache = require('../../../shared/utils/cacheService');
const GrammarRepository = require('../repositories/grammarRepository');
const grammarImageService = require('../services/grammarImageService');
const { invalidateGrammarCache } = require('../utils/cacheHelper');
const { Grammar } = require('../models/grammar');
const { completeLearningProgression } = require('../../../shared/utils/learningProgression');

class GrammarService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new GrammarRepository();
        this.imageService = options.imageService || new grammarImageService("easytalk/grammar");
        this.cache = options.cacheService || cache;
        this.userProgressService = options.userProgressService || null;
    }

    getUserProgressService() {
        if (!this.userProgressService) {
            const UserProgressService = require('../../userprogress/services/userprogressService');
            this.userProgressService = new UserProgressService();
        }
        return this.userProgressService;
    }

    async getGrammarList(page = 1, limit = 12, search = "", role = "user") {
        const cacheKey = `grammar:list:page=${page}:limit=${limit}:search=${search}:role=${role}`;
        const ttl = 300;
        return await this.cache.getOrSet(cacheKey, ttl, async () => {
            const skip = (page - 1) * limit;
            const filter = {};
            if (role !== "admin") {
                filter.display = true;
            }
            if (search) filter.title = { $regex: search, $options: "i" };
            const { grammars, total } = await this.repository.findAll(filter, skip, limit);
            return { grammars, totalGrammars: total };
        });
    }

    async getGrammar(id) {
        return await this.cache.getOrSet(`grammar:item:id=${id}`, 600, async () => {
            return await this.repository.findById(id);
        });
    }

    async getGrammarBySlug(slug) {
        return await this.cache.getOrSet(`grammar:item:slug=${slug}`, 600, async () => {
            return await this.repository.findBySlug(slug);
        });
    }

    async _getOrCreateUserProgress(userId) {
        const userProgressService = this.getUserProgressService();
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstGrammarPage = await this.getGrammarList(1, 1);
            const firstGrammar = (firstGrammarPage && firstGrammarPage.grammars && firstGrammarPage.grammars[0]) ? firstGrammarPage.grammars[0] : null;
            userProgress = await userProgressService.createUserProgress(userId, null, null, firstGrammar ? firstGrammar._id : null, null);
        }
        return userProgress;
    }

    async getGrammarDetails(userId, grammarId) {
        const grammar = await this.getGrammar(grammarId);
        if (!grammar) {
            return { status: 404, data: { message: "Grammar not found" } };
        }
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isUnlocked = (userProgress.unlockedGrammars || []).some(s => s.toString() == grammarId.toString());
        if (!isUnlocked) {
            return { status: 403, data: { success: false, message: "This grammar is locked for you. Please complete previous grammars first." } };
        }
        return { status: 200, data: { grammar, userProgress } };
    }

    async completeGrammar(userId, grammarId) {
        const grammar = await this.getGrammar(grammarId);
        if (!grammar) {
            return { status: 404, data: { success: false, message: "Grammar not found" } };
        }
        const userProgressService = this.getUserProgressService();
        let userProgress = await this._getOrCreateUserProgress(userId);
        const isGrammarUnlocked = (userProgress.unlockedGrammars || []).some(s => s.toString() == grammarId.toString());
        if (!isGrammarUnlocked) {
            return { status: 403, data: { success: false, message: "You cannot complete a locked grammar." } };
        }
        const { nextItem: nextGrammar, userProgress: completedProgress } = await completeLearningProgression({
            repository: this.repository,
            currentItem: grammar,
            userId,
            userProgress,
            userProgressService,
            unlockNext: userProgressService.unlockNextGrammar.bind(userProgressService),
            unlockedField: "unlockedGrammars"
        });
        return {
            status: 200,
            data: {
                success: true,
                message: nextGrammar ? "Grammar completed. Next grammar unlocked." : "Grammar completed. You have finished all grammars.",
                userProgress: completedProgress
            }
        };
    }

    async insertGrammar(grammarData, file = null) {
        let imageUrl = null;
        if (file) {
            const publicIdBase = await this.imageService.getNextPublicId(this.repository, 'grammar');
            imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
        } else if (grammarData.images) {
            imageUrl = grammarData.images;
        }
        const document = Grammar.buildDocument({ ...grammarData, images: imageUrl });
        const result = await this.repository.insert(document);
        await invalidateGrammarCache();
        return { status: 201, data: { message: "Bài học ngữ pháp đã được thêm thành công !", result } };
    }

    async updateGrammar(id, grammarData, file = null) {
        const existing = await this.getGrammar(id);
        if (!existing) return { status: 404, data: { message: "Bài học ngữ pháp không tìm thấy." } };
        let imageUrl = existing.images || grammarData.images || "";
        if (file) {
            const existingPublicId = existing.images ? this.imageService.extractPublicIdFromUrl(existing.images) : null;
            if (existingPublicId) {
                imageUrl = await this.imageService.uploadReplacementImage(file, existingPublicId);
            } else {
                const publicIdBase = await this.imageService.getNextPublicId(this.repository, 'grammar');
                imageUrl = await this.imageService.uploadNewImage(file, publicIdBase);
            }
        }
        const document = Grammar.buildDocument({ ...grammarData, images: imageUrl });
        delete document.createdAt;
        document.updatedAt = new Date();
        const result = await this.repository.update(id, document);
        await invalidateGrammarCache();
        return { status: 200, data: { message: "Bài học ngữ pháp đã được cập nhật thành công !", result } };
    }

    async deleteGrammar(id) {
        const existing = await this.getGrammar(id);
        if (!existing) return { status: 404, data: { message: "Bài học ngữ pháp không tìm thấy." } };
        if (existing.images) {
            const publicId = this.imageService.extractPublicIdFromUrl(existing.images);
            if (publicId) await this.imageService.deleteImage(publicId);
        }
        await this.repository.delete(id);
        await invalidateGrammarCache();
        return { status: 200, data: { message: "Bài học ngữ pháp đã xóa thành công !" } };
    }
}

module.exports = GrammarService;