class AIProviderDebugService {
    constructor(deps = {}) {
        this.aiProviderService = deps.aiProviderService || null;
        this.aiUsageService = deps.aiUsageService || null;
        this.aiTextToSpeechService = deps.aiTextToSpeechService || null;
        this.dailyPlanCacheService = deps.dailyPlanCacheService || null;
        this.now = deps.now || (() => new Date());
    }

    async getDebugSnapshot(options = {}) {
        const recentLimit = Math.min(Number.parseInt(options.recentLimit || 20, 10) || 20, 100);
        const [usageToday, recentUsage] = await Promise.all([
            this.aiUsageService?.getGlobalTodaySummary
                ? this.aiUsageService.getGlobalTodaySummary()
                : null,
            this.aiUsageService?.getRecentUsage
                ? this.aiUsageService.getRecentUsage(recentLimit)
                : []
        ]);

        const fallbackSummary = this.buildFallbackSummary(recentUsage);
        const taskSummary = this.buildTaskSummary(recentUsage);
        const latencySummary = this.buildLatencySummary(recentUsage);

        return {
            generatedAt: this.now(),
            provider: this.aiProviderService?.getStatus ? this.aiProviderService.getStatus() : null,
            registeredProviders: this.aiProviderService?.getRegisteredProviders ? this.aiProviderService.getRegisteredProviders() : [],
            limits: {
                dailyLimitPerUser: this.aiUsageService?.getDailyLimit ? this.aiUsageService.getDailyLimit() : null
            },
            usageToday,
            fallbackSummary,
            taskSummary,
            latencySummary,
            recentUsage,
            dailyPlanCache: this.dailyPlanCacheService?.getStatus ? this.dailyPlanCacheService.getStatus() : null,
            tts: this.aiTextToSpeechService?.getStatus ? this.aiTextToSpeechService.getStatus() : null
        };
    }

    buildFallbackSummary(records = []) {
        return records.reduce((summary, record) => {
            const metadata = record.metadata || {};
            if (!metadata.hadFallback) return summary;
            const code = metadata.fallback?.code || "UNKNOWN_FALLBACK";
            summary.total += 1;
            summary.byCode[code] = (summary.byCode[code] || 0) + 1;
            summary.byTask[record.task] = (summary.byTask[record.task] || 0) + 1;
            return summary;
        }, { total: 0, byCode: {}, byTask: {} });
    }

    buildTaskSummary(records = []) {
        return records.reduce((summary, record) => {
            const current = summary[record.task] || {
                requests: 0,
                totalTokens: 0,
                estimatedCostUsd: 0
            };
            current.requests += 1;
            current.totalTokens += record.totalTokens || 0;
            current.estimatedCostUsd = Number((current.estimatedCostUsd + (record.estimatedCostUsd || 0)).toFixed(8));
            summary[record.task] = current;
            return summary;
        }, {});
    }

    buildLatencySummary(records = []) {
        const latencies = records
            .map(record => record.metadata?.latencyMs)
            .filter(value => typeof value === "number" && Number.isFinite(value));
        if (!latencies.length) {
            return { count: 0, averageMs: null, maxMs: null };
        }
        const total = latencies.reduce((sum, value) => sum + value, 0);
        return {
            count: latencies.length,
            averageMs: Math.round(total / latencies.length),
            maxMs: Math.max(...latencies)
        };
    }
}

module.exports = AIProviderDebugService;
