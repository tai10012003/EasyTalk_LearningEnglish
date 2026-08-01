function parsePositiveInteger(value, fallback, options = {}) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return fallback;
    if (options.max && parsed > options.max) return options.max;
    return parsed;
}

function validateDailyPlanQuery(query = {}) {
    if (query.targetMinutes === undefined || query.targetMinutes === null || query.targetMinutes === '') {
        return { targetMinutes: null };
    }
    return {
        targetMinutes: parsePositiveInteger(query.targetMinutes, 10, { max: 120 })
    };
}

function validateModesQuery(query = {}) {
    const allowedActivityTypes = ["chat", "writing", "listening", "pronunciation", "daily_plan"];
    const activityType = typeof query.activityType === "string" ? query.activityType.trim() : "";
    if (activityType && !allowedActivityTypes.includes(activityType)) {
        return { valid: false, errors: [`activityType must be one of: ${allowedActivityTypes.join(", ")}`] };
    }
    return { valid: true, errors: [], activityType: activityType || null };
}

function validateStartChat(body = {}) {
    const errors = [];
    if (body.mode !== undefined && typeof body.mode !== 'string') {
        errors.push('mode must be a string');
    }
    if (body.topic !== undefined && typeof body.topic !== 'string') {
        errors.push('topic must be a string');
    }
    return { valid: errors.length === 0, errors };
}

function validateChatMessage(body = {}) {
    const errors = [];
    if (!body.sessionId || typeof body.sessionId !== 'string') {
        errors.push('sessionId is required');
    }
    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
        errors.push('message is required');
    }
    if (body.message && body.message.length > 1000) {
        errors.push('message must be at most 1000 characters');
    }
    return { valid: errors.length === 0, errors };
}

module.exports = { validateDailyPlanQuery, validateModesQuery, validateStartChat, validateChatMessage };
