class AgentDebugDashboardService {
    constructor(db) {
        this.db = db;
        this.aiUsages = db.collection("aiusages");
        this.agentLearningEvents = db.collection("agentlearningevents");
        this.agentSessions = db.collection("agentsessions");
        this.learnerMemories = db.collection("learnermemories");
    }

    async getAgentDebugOverview() {
        const today = this.getDateKey(new Date());
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [
            usageToday,
            taskBreakdown,
            fallbackBreakdown,
            recentUsage,
            recentLearningEvents,
            recentSessions,
            memorySignals
        ] = await Promise.all([
            this.getUsageSummary({ date: today }),
            this.getTaskBreakdown(today),
            this.getFallbackBreakdown(today),
            this.getRecentUsage(8),
            this.getRecentLearningEvents(8),
            this.getRecentSessions(6),
            this.getMemorySignals(sevenDaysAgo, 8)
        ]);

        return {
            today,
            usageToday,
            taskBreakdown,
            fallbackBreakdown,
            recentUsage,
            recentLearningEvents,
            recentSessions,
            memorySignals
        };
    }

    async getUsageSummary(match) {
        const [summary] = await this.aiUsages.aggregate([
            { $match: match },
            {
                $group: {
                    _id: null,
                    requests: { $sum: 1 },
                    inputTokens: { $sum: "$inputTokens" },
                    outputTokens: { $sum: "$outputTokens" },
                    totalTokens: { $sum: "$totalTokens" },
                    estimatedCostUsd: { $sum: "$estimatedCostUsd" },
                    uniqueUsers: { $addToSet: "$user" },
                    fallbackCount: {
                        $sum: {
                            $cond: [{ $eq: ["$metadata.hadFallback", true] }, 1, 0]
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    requests: 1,
                    inputTokens: 1,
                    outputTokens: 1,
                    totalTokens: 1,
                    estimatedCostUsd: { $round: ["$estimatedCostUsd", 8] },
                    fallbackCount: 1,
                    uniqueUsers: { $size: "$uniqueUsers" }
                }
            }
        ]).toArray();

        return summary || {
            requests: 0,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            estimatedCostUsd: 0,
            fallbackCount: 0,
            uniqueUsers: 0
        };
    }

    async getTaskBreakdown(date) {
        return await this.aiUsages.aggregate([
            { $match: { date } },
            {
                $group: {
                    _id: "$task",
                    requests: { $sum: 1 },
                    totalTokens: { $sum: "$totalTokens" },
                    estimatedCostUsd: { $sum: "$estimatedCostUsd" },
                    fallbackCount: {
                        $sum: {
                            $cond: [{ $eq: ["$metadata.hadFallback", true] }, 1, 0]
                        }
                    }
                }
            },
            { $sort: { requests: -1 } },
            {
                $project: {
                    _id: 0,
                    task: "$_id",
                    requests: 1,
                    totalTokens: 1,
                    estimatedCostUsd: { $round: ["$estimatedCostUsd", 8] },
                    fallbackCount: 1
                }
            }
        ]).toArray();
    }

    async getFallbackBreakdown(date) {
        return await this.aiUsages.aggregate([
            { $match: { date, "metadata.hadFallback": true } },
            {
                $group: {
                    _id: {
                        task: "$task",
                        code: "$metadata.fallback.code"
                    },
                    count: { $sum: 1 },
                    latestMessage: { $last: "$metadata.fallback.message" },
                    latestAt: { $max: "$createdAt" }
                }
            },
            { $sort: { count: -1, latestAt: -1 } },
            {
                $project: {
                    _id: 0,
                    task: "$_id.task",
                    code: "$_id.code",
                    count: 1,
                    latestMessage: 1,
                    latestAt: 1
                }
            }
        ]).toArray();
    }

    async getRecentUsage(limit) {
        return await this.aiUsages
            .find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .project({
                user: 1,
                provider: 1,
                mode: 1,
                model: 1,
                task: 1,
                totalTokens: 1,
                estimatedCostUsd: 1,
                metadata: 1,
                createdAt: 1
            })
            .toArray();
    }

    async getRecentLearningEvents(limit) {
        return await this.agentLearningEvents
            .find({})
            .sort({ createdAt: -1 })
            .limit(limit)
            .project({
                user: 1,
                source: 1,
                skill: 1,
                eventType: 1,
                score: 1,
                mistakes: 1,
                weakSkills: 1,
                metadata: 1,
                createdAt: 1
            })
            .toArray();
    }

    async getRecentSessions(limit) {
        return await this.agentSessions
            .find({})
            .sort({ updatedAt: -1, createdAt: -1 })
            .limit(limit)
            .project({
                user: 1,
                type: 1,
                status: 1,
                mode: 1,
                summary: 1,
                mistakes: 1,
                recommendedNextActions: 1,
                startedAt: 1,
                endedAt: 1,
                updatedAt: 1
            })
            .toArray();
    }

    async getMemorySignals(sinceDate, limit) {
        return await this.learnerMemories
            .find({ "learningSignals.updatedAt": { $gte: sinceDate } })
            .sort({ "learningSignals.updatedAt": -1 })
            .limit(limit)
            .project({
                user: 1,
                weakSkills: 1,
                frequentMistakes: 1,
                learningSignals: 1,
                updatedAt: 1
            })
            .toArray();
    }

    getDateKey(date) {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Ho_Chi_Minh",
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        }).format(date);
    }
}

module.exports = AgentDebugDashboardService;
