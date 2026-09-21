const { ObjectId } = require('mongodb');
const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { policies, withTags } = require('../../../shared/utils/cachePolicies');
const StageRepository = require('../repositories/stageRepository');
const { invalidateStageCache } = require('../utils/cacheHelper');

class StageService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new StageRepository();
        this.cache = options.cacheService || cache;
        this.gateService = options.gateService || null;
        this.journeyService = options.journeyService || null;
        this.userProgressService = options.userProgressService || null;
        this.englishTranslationService = options.englishTranslationService || null;
    }

    setGateService(service) {
        this.gateService = service;
    }

    setJourneyService(service) {
        this.journeyService = service;
    }

    setUserProgressService(service) {
        this.userProgressService = service;
    }

    getRequiredServices() {
        const missing = [];
        if (!this.gateService) missing.push("gateService");
        if (!this.journeyService) missing.push("journeyService");
        if (!this.userProgressService) missing.push("userProgressService");
        if (missing.length) {
            throw new Error(`StageService requires ${missing.join(", ")}`);
        }
        return {
            gateService: this.gateService,
            journeyService: this.journeyService,
            userProgressService: this.userProgressService
        };
    }

    async getStageList(page = 1, limit = 12, options = {}) {
        const cacheKey = cacheNs.listKey('stage', { page, limit });
        const result = await this.cache.getOrSet(cacheKey, withTags(policies.relationList('stage'), cacheNs.listTags('stage')), async () => {
            const { stages, total } = await this.repository.findAll(page, limit);
            return { stages, totalStages: total };
        });
        return {
            ...result,
            stages: await this.applyStageListTranslations(result.stages, options.lang)
        };
    }

    async getStageById(id, options = {}) {
        const cacheKey = cacheNs.key('stage', 'detail', { id });
        const stage = await this.cache.getOrSet(cacheKey, withTags(policies.relationDetail('stage'), [cacheNs.tag('stage', 'detail'), cacheNs.tag('stage', 'detail', id), cacheNs.tag('stage', 'all')]), async () => {
            return await this.repository.findById(id);
        });
        return await this.applyStageTranslation(stage, options.lang);
    }

    async getStageDetailForUser(stageId, userId, options = {}) {
        const { userProgressService } = this.getRequiredServices();
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            userProgress = await userProgressService.createUserProgress(userId, {});
        }
        const stage = await this.getStageById(stageId, { lang: options.lang });
        return { stage, userProgress };
    }

    async getStagesInGate(gateId) {
        return await this.repository.findByGate(gateId);
    }

    async getGateOptions() {
        const { gateService } = this.getRequiredServices();
        return await gateService.getGateList();
    }

    async insertStage(stageData) {
        const formattedQuestions = this._formatQuestions(stageData.questions || []);
        const dataToInsert = {
            title: stageData.title,
            gate: new ObjectId(stageData.gate),
            questions: formattedQuestions
        };
        const result = await this.repository.insert(dataToInsert);
        await invalidateStageCache();
        return result;
    }

    async createStage(stageData) {
        const { gateService } = this.getRequiredServices();
        const result = await this.insertStage({
            title: stageData.title,
            questions: stageData.questions,
            gate: stageData.gateId
        });
        await gateService.addStageToGate(stageData.gateId, result.insertedId);
        return result;
    }

    async updateStage(stageId, updateData) {
        const formattedQuestions = this._formatQuestions(updateData.questions || []);
        const dataToUpdate = {
            title: updateData.title,
            gate: new ObjectId(updateData.gate),
            questions: formattedQuestions
        };
        const result = await this.repository.update(stageId, dataToUpdate);
        await invalidateStageCache();
        return result;
    }

    async updateStageAndGateLink(stageId, updateData) {
        const { gateService } = this.getRequiredServices();
        const currentStage = await this.getStageById(stageId);
        if (!currentStage) {
            return null;
        }
        const oldGateId = currentStage.gate ? currentStage.gate.toString() : null;
        const result = await this.updateStage(stageId, {
            title: updateData.title,
            questions: updateData.questions,
            gate: updateData.gateId
        });
        if (oldGateId && oldGateId !== updateData.gateId) {
            await gateService.removeStageFromGate(oldGateId, stageId);
            await gateService.addStageToGate(updateData.gateId, stageId);
        }
        return result;
    }

    async deleteStage(id) {
        const result = await this.repository.delete(id);
        await invalidateStageCache();
        return result;
    }

    async deleteStageAndGateLink(stageId) {
        const { gateService } = this.getRequiredServices();
        const currentStage = await this.getStageById(stageId);
        if (!currentStage) {
            return null;
        }
        const result = await this.deleteStage(stageId);
        await gateService.removeStageFromGate(currentStage.gate, stageId);
        return result;
    }

    async deleteStageByGate(gateId) {
        const result = await this.repository.deleteByGate(gateId);
        await invalidateStageCache();
        return result;
    }

    async applyStageTranslation(stage, lang = "vi") {
        if (lang !== "en" || !this.englishTranslationService || !stage?._id) return stage;
        return await this.englishTranslationService.applyTranslationToItem("stage", stage, lang);
    }

    async applyStageListTranslations(stages = [], lang = "vi") {
        if (lang !== "en" || !this.englishTranslationService || !Array.isArray(stages) || stages.length === 0) {
            return stages;
        }
        const localizedStages = await this.englishTranslationService.applyTranslations("stage", stages, lang);
        const gateInfoItems = localizedStages.map((stage) => stage.gateInfo).filter((gate) => gate?._id);
        const localizedGateInfo = await this.englishTranslationService.applyTranslations("gate", gateInfoItems, lang);
        const gateMap = new Map(localizedGateInfo.map((gate) => [gate._id.toString(), gate]));
        const journeyInfoItems = localizedGateInfo.map((gate) => gate.journeyInfo).filter((journey) => journey?._id);
        const localizedJourneyInfo = await this.englishTranslationService.applyTranslations("journey", journeyInfoItems, lang);
        const journeyMap = new Map(localizedJourneyInfo.map((journey) => [journey._id.toString(), journey]));
        return localizedStages.map((stage) => {
            const localizedGate = stage.gateInfo?._id ? gateMap.get(stage.gateInfo._id.toString()) || stage.gateInfo : stage.gateInfo;
            return {
                ...stage,
                gateInfo: localizedGate?._id ? { ...localizedGate, journeyInfo: localizedGate.journeyInfo?._id ? journeyMap.get(localizedGate.journeyInfo._id.toString()) || localizedGate.journeyInfo : localizedGate.journeyInfo } : localizedGate
            };
        });
    }

    async completeStageForUser(stageId, userId) {
        const { gateService, journeyService, userProgressService } = this.getRequiredServices();
        const currentStage = await this.getStageById(stageId);
        if (!currentStage) {
            return { status: "stage_not_found" };
        }
        const gate = await gateService.getGateById(currentStage.gate);
        if (!gate) {
            return { status: "gate_not_found" };
        }
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const journey = await journeyService.getJourney(gate.journey);
            userProgress = await userProgressService.createUserProgress(userId, { journey });
        }
        const updatedProgress = await this.applyStageCompletion(stageId, currentStage, userProgress, gateService);
        await userProgressService.updateUserProgress(updatedProgress);
        return { status: "completed" };
    }

    async applyStageCompletion(stageId, currentStage, userProgress, gateService) {
        if (!userProgress.unlockedStages.some(stage => stage.toString() == stageId)) {
            userProgress.unlockedStages.push(new ObjectId(stageId));
        }
        const allStagesInGate = await this.getStagesInGate(currentStage.gate);
        const currentStageIndex = allStagesInGate.findIndex(stage => stage._id.toString() == stageId);
        if (currentStageIndex !== -1 && currentStageIndex < allStagesInGate.length - 1) {
            const nextStage = allStagesInGate[currentStageIndex + 1];
            if (!userProgress.unlockedStages.some(stage => stage.toString() == nextStage._id.toString())) {
                userProgress.unlockedStages.push(nextStage._id);
            }
        } else {
            const gate = await gateService.getGateById(currentStage.gate);
            if (!gate) {
                throw new Error("Không thể tìm thấy cổng cho chặng hiện tại.");
            }
            const allGatesInJourney = await gateService.getGatesInJourney(gate.journey);
            const currentGateIndex = allGatesInJourney.findIndex(g => g._id.toString() == currentStage.gate.toString());
            if (currentGateIndex !== -1 && currentGateIndex < allGatesInJourney.length - 1) {
                const nextGate = allGatesInJourney[currentGateIndex + 1];
                if (!userProgress.unlockedGates.some(gateId => gateId.toString() == nextGate._id.toString())) {
                    userProgress.unlockedGates.push(nextGate._id);
                    const firstStageOfNextGate = await this.getStagesInGate(nextGate._id);
                    if (firstStageOfNextGate.length > 0 &&
                        !userProgress.unlockedStages.some(stage => stage.toString() == firstStageOfNextGate[0]._id.toString())) {
                        userProgress.unlockedStages.push(firstStageOfNextGate[0]._id);
                    }
                }
            }
        }
        userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
        return userProgress;
    }

    _formatQuestions(questions) {
        if (!Array.isArray(questions)) return [];
        return questions.map(q => ({
            question: q.question,
            type: q.type,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            options: q.options || []
        }));
    }
}

module.exports = StageService;
