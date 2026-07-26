const AgentMode = require("../models/agentMode");
const AgentModeRepository = require("../repositories/agentModeRepository");
const DEFAULT_AGENT_MODES = require("../defaults/agentModes");

class AgentModeService {
    constructor(deps = {}) {
        this.repository = deps.repository || new AgentModeRepository();
        this.defaultModes = deps.defaultModes || DEFAULT_AGENT_MODES;
    }

    async listModes(options = {}) {
        const filter = { display: true };
        if (options.activityType) filter.activityType = options.activityType;
        let modes = [];
        try {
            modes = await this.repository.findAll(filter);
        } catch (error) {
            console.error("Failed to load agent modes from MongoDB:", error.message);
        }
        if (!modes.length) {
            modes = this.defaultModes.filter(mode => {
                if (mode.display === false) return false;
                return !options.activityType || mode.activityType === options.activityType;
            });
        }
        return this.rankForMemory(modes.map(AgentMode.toPublic), options.memory);
    }

    async getMode(key, activityType = null) {
        let mode = null;
        try {
            mode = await this.repository.findByKey(key, activityType);
        } catch (error) {
            console.error("Failed to load agent mode from MongoDB:", error.message);
        }
        if (!mode) {
            mode = this.defaultModes.find(item => item.key === key && (!activityType || item.activityType === activityType));
        }
        if (!mode) return null;
        return AgentMode.toPublic(mode);
    }

    async getModeOrDefault(key, activityType, fallbackKey) {
        return await this.getMode(key, activityType)
            || await this.getMode(fallbackKey, activityType)
            || AgentMode.toPublic(this.defaultModes.find(mode => mode.activityType === activityType));
    }

    async seedDefaultModes() {
        const results = [];
        for (const modeData of this.defaultModes) {
            const document = AgentMode.buildDocument(modeData);
            const errors = AgentMode.validate(document);
            if (errors.length) {
                throw new Error(`Invalid default agent mode ${modeData.key}: ${errors.join(", ")}`);
            }
            const result = await this.repository.upsertByKey(document);
            results.push({ key: document.key, activityType: document.activityType, upserted: result.upsertedCount || 0, modified: result.modifiedCount || 0 });
        }
        return results;
    }

    rankForMemory(modes, memory = null) {
        if (!memory) return modes.sort((a, b) => a.sort - b.sort);
        const weakSkills = new Set(memory.weakSkills || []);
        const goals = new Set(memory.learningGoals || []);
        return modes
            .map(mode => {
                const focus = mode.skillFocus || [];
                const score = focus.reduce((total, skill) => total + (weakSkills.has(skill) ? 5 : 0) + (goals.has(skill) ? 3 : 0), 0);
                return { ...mode, recommendedScore: score };
            })
            .sort((a, b) => b.recommendedScore - a.recommendedScore || a.sort - b.sort);
    }
}

module.exports = AgentModeService;
