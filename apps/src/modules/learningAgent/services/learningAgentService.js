const DailyPlanAgent = require('../agents/dailyPlanAgent');
const ProgressTool = require('../tools/progressTool');
const MemoryTool = require('../tools/memoryTool');
const DailyPlanCacheService = require('./dailyPlanCacheService');

class LearningAgentService {
    constructor(deps = {}) {
        this.userProgressService = deps.userProgressService || null;
        this.learnerMemoryService = deps.learnerMemoryService || null;
        this.aiProviderService = deps.aiProviderService || null;
        this.dailyPlanAgent = deps.dailyPlanAgent || new DailyPlanAgent();
        this.progressTool = deps.progressTool || new ProgressTool({ userProgressService: this.userProgressService });
        this.memoryTool = deps.memoryTool || new MemoryTool({ learnerMemoryService: this.learnerMemoryService });
        this.dailyPlanCacheService = deps.dailyPlanCacheService || new DailyPlanCacheService();
    }

    setUserProgressService(service) {
        this.userProgressService = service;
        this.progressTool.setUserProgressService(service);
    }

    setLearnerMemoryService(service) {
        this.learnerMemoryService = service;
        this.memoryTool.setLearnerMemoryService(service);
    }

    setAIProviderService(service) {
        this.aiProviderService = service;
    }

    setDailyPlanAgent(agent) {
        this.dailyPlanAgent = agent;
    }

    async getDailyPlan(userId, options = {}) {
        const [progress, memory] = await Promise.all([
            this.progressTool.getUserProgress(userId),
            this.memoryTool.getOrCreateMemory(userId)
        ]);
        const targetResolution = this.learnerMemoryService?.resolveTargetStudyMinutes
            ? this.learnerMemoryService.resolveTargetStudyMinutes(memory, options.targetMinutes)
            : { effectiveTargetMinutes: this.dailyPlanAgent.normalizeTargetMinutes(options.targetMinutes) };
        const targetMinutes = this.dailyPlanAgent.normalizeTargetMinutes(targetResolution.effectiveTargetMinutes);
        const cachedPlan = await this.dailyPlanCacheService.get({ userId, targetMinutes, memory });
        if (cachedPlan) {
            const safeCachedPlan = this.attachStudyPreferences(cachedPlan.plan, memory, targetResolution);
            return this.markCacheHit(safeCachedPlan, cachedPlan.metadata);
        }

        const basePlan = this.dailyPlanAgent.buildPlan(progress, memory, {
            ...options,
            targetMinutes
        });
        basePlan.learnerSnapshot = {
            ...(basePlan.learnerSnapshot || {}),
            memory: {
                ...(basePlan.learnerSnapshot?.memory || {}),
                studyPreferences: {
                    ...(memory?.studyPreferences || {}),
                    ...targetResolution
                }
            }
        };
        let plan = basePlan;

        if (this.aiProviderService) {
            plan = await this.aiProviderService.enhanceDailyPlan(basePlan, { userId });
        }
        plan = this.attachStudyPreferences(plan, memory, targetResolution);

        const cacheKey = await this.dailyPlanCacheService.set({
            userId,
            targetMinutes,
            memory,
            plan,
            metadata: {
                targetMinutes,
                memoryVersion: memory?.memoryVersion || "learner-memory-v1"
            }
        });

        return this.markCacheMiss(plan, cacheKey);
    }

    attachStudyPreferences(plan, memory = null, targetResolution = {}) {
        return {
            ...plan,
            learnerSnapshot: {
                ...(plan?.learnerSnapshot || {}),
                memory: {
                    ...(plan?.learnerSnapshot?.memory || {}),
                    studyPreferences: {
                        ...(memory?.studyPreferences || {}),
                        ...targetResolution
                    }
                }
            }
        };
    }

    markCacheHit(plan, metadata = {}) {
        return {
            ...plan,
            aiProvider: {
                ...(plan.aiProvider || {}),
                cache: {
                    hit: true,
                    key: metadata.cacheKey,
                    cachedAt: metadata.cachedAt,
                    expiresAt: metadata.expiresAt
                }
            }
        };
    }

    markCacheMiss(plan, cacheKey = null) {
        return {
            ...plan,
            aiProvider: {
                ...(plan.aiProvider || {}),
                cache: {
                    hit: false,
                    key: cacheKey
                }
            }
        };
    }

    buildLearnerProfile(...args) {
        return this.dailyPlanAgent.buildLearnerProfile(...args);
    }

    buildTasks(...args) {
        return this.dailyPlanAgent.buildTasks(...args);
    }

    normalizeTargetMinutes(...args) {
        return this.dailyPlanAgent.normalizeTargetMinutes(...args);
    }

    createTask(...args) {
        return this.dailyPlanAgent.createTask(...args);
    }

    fitTasksToTargetMinutes(...args) {
        return this.dailyPlanAgent.fitTasksToTargetMinutes(...args);
    }

    distributeTaskMinutes(...args) {
        return this.dailyPlanAgent.distributeTaskMinutes(...args);
    }

    buildHeadline(...args) {
        return this.dailyPlanAgent.buildHeadline(...args);
    }

    buildMotivation(...args) {
        return this.dailyPlanAgent.buildMotivation(...args);
    }
}

module.exports = LearningAgentService;
