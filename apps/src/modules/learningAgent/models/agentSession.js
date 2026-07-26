const { ObjectId } = require('mongodb');

const SESSION_TYPES = ['daily_plan', 'chat', 'writing'];
const SESSION_STATUSES = ['active', 'completed'];

class AgentSession {
    constructor(doc = {}) {
        this._id = doc._id || null;
        this.user = doc.user || null;
        this.type = doc.type || 'chat';
        this.status = doc.status || 'active';
        this.mode = doc.mode || 'speaking_practice';
        this.modeConfigSnapshot = doc.modeConfigSnapshot || null;
        this.topic = doc.topic || null;
        this.messages = doc.messages || [];
        this.summary = doc.summary || null;
        this.mistakes = doc.mistakes || [];
        this.recommendedNextActions = doc.recommendedNextActions || [];
        this.startedAt = doc.startedAt || null;
        this.endedAt = doc.endedAt || null;
        this.createdAt = doc.createdAt || null;
        this.updatedAt = doc.updatedAt || null;
    }

    static buildChatDocument(userId, data = {}) {
        const now = new Date();
        return {
            user: new ObjectId(userId),
            type: 'chat',
            status: 'active',
            mode: data.mode || 'speaking_practice',
            modeConfigSnapshot: data.modeConfigSnapshot || null,
            topic: data.topic || null,
            messages: [],
            summary: null,
            mistakes: [],
            recommendedNextActions: [],
            startedAt: now,
            endedAt: null,
            createdAt: now,
            updatedAt: now
        };
    }

    static buildMessage(role, content, metadata = {}) {
        return {
            role,
            content,
            metadata,
            createdAt: new Date()
        };
    }

    static validate(doc = {}) {
        const errors = [];
        if (!doc.user) errors.push('user is required');
        if (doc.type && !SESSION_TYPES.includes(doc.type)) {
            errors.push(`type must be one of: ${SESSION_TYPES.join(', ')}`);
        }
        if (doc.status && !SESSION_STATUSES.includes(doc.status)) {
            errors.push(`status must be one of: ${SESSION_STATUSES.join(', ')}`);
        }
        return errors;
    }
}

module.exports = AgentSession;
