const crypto = require("crypto");
const cacheNs = require("../../../shared/utils/cacheNamespaces");

const DAILY_PLAN_CACHE_SCHEMA_VERSION = "daily-plan-v8-time-selection-copy";

class DailyPlanCacheService {
    constructor(options = {}) {
        this.enabled = options.enabled ?? process.env.AI_DAILY_PLAN_CACHE_ENABLED !== "false";
        this.ttlSeconds = Number.parseInt(options.ttlSeconds || process.env.AI_DAILY_PLAN_CACHE_TTL_SECONDS || "86400", 10);
        this.sharedCacheEnabled = options.sharedCacheEnabled ?? process.env.AI_DAILY_PLAN_SHARED_CACHE_ENABLED !== "false";
        this.cacheService = options.cacheService || null;
        this.now = options.now || (() => new Date());
        this.store = options.store || new Map();
    }

    getStatus() {
        return {
            enabled: this.enabled,
            sharedCacheEnabled: this.sharedCacheEnabled && Boolean(this.cacheService),
            ttlSeconds: this.ttlSeconds,
            memoryEntries: this.store.size
        };
    }

    async get({ userId, targetMinutes, memory }) {
        if (!this.enabled) return null;
        const key = this.buildKey({ userId, targetMinutes, memory });
        const sharedEntry = await this.getSharedEntry(key);
        if (sharedEntry?.plan) {
            return {
                source: "shared",
                key,
                metadata: sharedEntry.metadata || {},
                plan: this.clone(sharedEntry.plan)
            };
        }
        return this.getMemoryEntry(key);
    }

    getMemoryEntry(key) {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (entry.expiresAt <= this.now().getTime()) {
            this.store.delete(key);
            return null;
        }
        return {
            source: "memory",
            key,
            metadata: entry.metadata,
            plan: this.clone(entry.plan)
        };
    }

    async set({ userId, targetMinutes, memory, plan, metadata = {} }) {
        if (!this.enabled || !plan) return null;
        const key = this.buildKey({ userId, targetMinutes, memory });
        const expiresAt = this.now().getTime() + Math.max(1, this.ttlSeconds) * 1000;
        const cacheMetadata = {
            ...metadata,
            cacheKey: key,
            cachedAt: this.now(),
            expiresAt: new Date(expiresAt)
        };

        await this.setSharedEntry(key, {
            plan: this.clone(plan),
            metadata: cacheMetadata
        }, {
            userId,
            targetMinutes,
            memory
        });

        this.store.set(key, {
            plan: this.clone(plan),
            expiresAt,
            metadata: cacheMetadata
        });
        return key;
    }

    buildKey({ userId, targetMinutes, memory }) {
        const date = this.getDateKey();
        const memoryVersion = memory?.memoryVersion || "learner-memory-v1";
        const memoryFingerprint = this.buildMemoryFingerprint(memory);
        return cacheNs.key("learningAgent", "dailyPlan", {
            id: [
                DAILY_PLAN_CACHE_SCHEMA_VERSION,
                String(userId),
                date,
                Number.parseInt(targetMinutes || 10, 10),
                memoryVersion,
                memoryFingerprint
            ].join(":")
        });
    }

    async getSharedEntry(key) {
        if (!this.shouldUseSharedCache()) return null;
        const entry = await this.cacheService.get(key);
        return entry && typeof entry === "object" ? entry : null;
    }

    async setSharedEntry(key, value, context = {}) {
        if (!this.shouldUseSharedCache()) return;
        await this.cacheService.set(key, this.ttlSeconds, value, {
            tags: this.buildTags(context)
        });
    }

    shouldUseSharedCache() {
        return this.sharedCacheEnabled && this.cacheService && typeof this.cacheService.get === "function" && typeof this.cacheService.set === "function";
    }

    buildTags({ userId, memory } = {}) {
        const memoryVersion = memory?.memoryVersion || "learner-memory-v1";
        return [
            cacheNs.tag("learningAgent", "dailyPlan"),
            cacheNs.tag("learningAgent", "dailyPlan", DAILY_PLAN_CACHE_SCHEMA_VERSION),
            cacheNs.tag("learningAgent", "dailyPlan", userId),
            cacheNs.tag("learningAgent", "memoryVersion", memoryVersion)
        ].filter(Boolean);
    }

    buildMemoryFingerprint(memory = {}) {
        const safeMemory = memory || {};
        const relevantMemory = {
            proficiencyLevel: safeMemory.proficiencyLevel || null,
            learningGoals: safeMemory.learningGoals || [],
            weakSkills: safeMemory.weakSkills || [],
            frequentMistakes: safeMemory.frequentMistakes || [],
            preferredTopics: safeMemory.preferredTopics || [],
            studyPreferences: safeMemory.studyPreferences || {},
            learningSignals: safeMemory.learningSignals || {},
            updatedAt: safeMemory.updatedAt || null
        };
        return crypto
            .createHash("sha1")
            .update(JSON.stringify(relevantMemory))
            .digest("hex")
            .slice(0, 16);
    }

    getDateKey() {
        return this.now().toISOString().slice(0, 10);
    }

    clone(value) {
        return JSON.parse(JSON.stringify(value));
    }
}

module.exports = DailyPlanCacheService;
