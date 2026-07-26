const { ObjectId } = require("mongodb");
const { getVietnamDate } = require("../../../shared/utils/dateFormat");
const AIUsageRepository = require("../repositories/aiUsageRepository");

class AIUsageLimitError extends Error {
    constructor(message, limit) {
        super(message);
        this.statusCode = 429;
        this.code = "AI_DAILY_LIMIT_REACHED";
        this.limit = limit;
    }
}

class AIUsageService {
    constructor(deps = {}) {
        this.repository = deps.repository || new AIUsageRepository();
        this.dailyLimitPerUser = Number.parseInt(
            deps.dailyLimitPerUser || process.env.AI_DAILY_LIMIT_PER_USER || "200",
            10
        );
    }

    getDailyLimit() {
        return this.dailyLimitPerUser;
    }

    async assertWithinDailyLimit(userId, date = getVietnamDate()) {
        if (!this.dailyLimitPerUser || this.dailyLimitPerUser <= 0) {
            return { allowed: true, used: 0, limit: this.dailyLimitPerUser };
        }
        const used = await this.repository.countByUserAndDate(userId, date);
        if (used >= this.dailyLimitPerUser) {
            throw new AIUsageLimitError(
                `Bạn đã đạt giới hạn ${this.dailyLimitPerUser} lượt AI hôm nay.`,
                this.dailyLimitPerUser
            );
        }
        return { allowed: true, used, limit: this.dailyLimitPerUser };
    }

    async recordUsage(userId, usage = {}) {
        const date = usage.date || getVietnamDate();
        const inputTokens = Math.max(0, usage.inputTokens || 0);
        const outputTokens = Math.max(0, usage.outputTokens || 0);
        const totalTokens = usage.totalTokens || inputTokens + outputTokens;
        const document = {
            user: new ObjectId(userId),
            date,
            task: usage.task || "unknown",
            provider: usage.provider || "mock",
            mode: usage.mode || "mock",
            model: usage.model || "unknown",
            inputTokens,
            outputTokens,
            totalTokens,
            estimatedCostUsd: usage.estimatedCostUsd || 0,
            metadata: usage.metadata || {},
            createdAt: new Date()
        };

        await this.repository.insert(document);
        return document;
    }

    async countTaskUsage(userId, date, task) {
        return await this.repository.countByUserDateAndTask(userId, date, task);
    }

    async getTodaySummary(userId) {
        const date = getVietnamDate();
        const summary = await this.repository.getDailySummary(userId, date);
        return {
            date,
            limit: this.dailyLimitPerUser,
            remaining: this.dailyLimitPerUser > 0
                ? Math.max(this.dailyLimitPerUser - summary.requests, 0)
                : null,
            ...summary
        };
    }
}

module.exports = AIUsageService;
module.exports.AIUsageLimitError = AIUsageLimitError;
