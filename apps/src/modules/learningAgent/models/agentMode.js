const ACTIVITY_TYPES = ["chat", "writing", "listening", "pronunciation", "daily_plan"];
const SKILL_FOCUS_VALUES = ["speaking", "listening", "reading", "writing", "grammar", "vocabulary", "pronunciation", "daily_habit"];
const CORRECTION_DEPTHS = ["light", "medium", "detailed"];

class AgentMode {
    static buildDocument(data = {}) {
        const now = new Date();
        const document = {
            key: String(data.key || "").trim(),
            activityType: data.activityType || "chat",
            title: String(data.title || "").trim(),
            description: String(data.description || "").trim(),
            skillFocus: Array.isArray(data.skillFocus) ? data.skillFocus : [],
            suggestedLevel: Array.isArray(data.suggestedLevel) ? data.suggestedLevel : [],
            estimatedMinutes: Number.parseInt(data.estimatedMinutes || 10, 10),
            correctionDepth: data.correctionDepth || "medium",
            openingPrompt: data.openingPrompt || "",
            promptHints: Array.isArray(data.promptHints) ? data.promptHints : [],
            config: data.config || {},
            display: data.display !== false,
            sort: Number.parseInt(data.sort || 0, 10),
            updatedAt: now
        };
        if (data._id) document._id = data._id;
        document.createdAt = data.createdAt || now;
        return document;
    }

    static validate(document = {}) {
        const errors = [];
        if (!document.key) errors.push("key is required");
        if (!/^[a-z0-9_]+$/.test(document.key || "")) errors.push("key must use lowercase letters, numbers, and underscores");
        if (!ACTIVITY_TYPES.includes(document.activityType)) errors.push(`activityType must be one of: ${ACTIVITY_TYPES.join(", ")}`);
        if (!document.title) errors.push("title is required");
        if (!document.description) errors.push("description is required");
        if (!CORRECTION_DEPTHS.includes(document.correctionDepth)) errors.push(`correctionDepth must be one of: ${CORRECTION_DEPTHS.join(", ")}`);
        const invalidSkills = (document.skillFocus || []).filter(skill => !SKILL_FOCUS_VALUES.includes(skill));
        if (invalidSkills.length) errors.push(`skillFocus contains invalid values: ${invalidSkills.join(", ")}`);
        return errors;
    }

    static toPublic(mode = {}) {
        return {
            key: mode.key,
            activityType: mode.activityType,
            title: mode.title,
            description: mode.description,
            skillFocus: mode.skillFocus || [],
            suggestedLevel: mode.suggestedLevel || [],
            estimatedMinutes: mode.estimatedMinutes || 10,
            correctionDepth: mode.correctionDepth || "medium",
            promptHints: mode.promptHints || [],
            config: mode.config || {},
            display: mode.display !== false,
            sort: mode.sort || 0
        };
    }
}

module.exports = AgentMode;
