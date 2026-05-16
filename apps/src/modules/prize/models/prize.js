const { ObjectId } = require('mongodb');

class Prize {
    constructor(doc = {}) {
        this._id = doc._id || null;
        this.code = doc.code || null;
        this.name = doc.name || null;
        this.type = doc.type || null;
        this.level = doc.level || null;
        this.requirement = doc.requirement || {};
        this.iconClass = doc.iconClass || null;
        this.diamondAwards = doc.diamondAwards || 0;
        this.championType = doc.championType || null;
        this.createdAt = doc.createdAt || null;
        this.updatedAt = doc.updatedAt || null;
    }

    static validate(doc) {
        const errors = [];
        if (!doc.code) {
            errors.push('code is required');
        }
        if (!doc.name) {
            errors.push('name is required');
        }
        if (!doc.type) {
            errors.push('type is required');
        }
        const validTypes = ['perfect_streak', 'knowledge_god', 'champion_week', 'champion_month', 'champion_year'];
        if (doc.type && !validTypes.includes(doc.type)) {
            errors.push(`type must be one of: ${validTypes.join(', ')}`);
        }
        if (doc.level !== undefined && (typeof doc.level !== 'number' || doc.level < 1)) {
            errors.push('level must be a positive number');
        }
        if (doc.requirement && typeof doc.requirement !== 'object') {
            errors.push('requirement must be an object');
        }
        if (doc.diamondAwards !== undefined && (typeof doc.diamondAwards !== 'number' || doc.diamondAwards < 0)) {
            errors.push('diamondAwards must be a non-negative number');
        }
        return errors;
    }

    static isChampionType(type) {
        return ['champion_week', 'champion_month', 'champion_year'].includes(type);
    }

    static getRequirementText(prize) {
        if (!prize.requirement) return '';
        if (prize.type === 'perfect_streak') {
            return `${prize.requirement.streakDays} ngày liên tục`;
        }
        if (prize.type === 'knowledge_god') {
            return `${prize.requirement.xp.toLocaleString('vi-VN')} XP`;
        }
        if (Prize.isChampionType(prize.type)) {
            return 'Top 1 bảng xếp hạng';
        }
        return '';
    }
}

module.exports = Prize;