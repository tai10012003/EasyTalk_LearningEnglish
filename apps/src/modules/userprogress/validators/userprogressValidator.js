const VALID_LEADERBOARD_TYPES = ['exp', 'time', 'streak'];
const VALID_STATISTIC_TYPES = ['time', 'exp'];
const VALID_PERIODS = ['week', 'month', 'year', 'all'];
const VALID_STATISTIC_PERIODS = ['week', 'month', 'year'];

function validateGoal(goal) {
    if(goal === undefined || goal === null) {
        return { valid: false, message: 'Goal is required' };
    }
    const parsed = Number(goal);
    if(isNaN(parsed)) {
        return { valid: false, message: 'Goal must be a number' };
    }
    if(parsed < 0 || parsed > 200) {
        return { valid: false, message: 'Goal must be between 0 and 200' };
    }
    return { valid: true, value: parsed };
}

function validateStudyTime(seconds) {
    if(seconds === undefined || seconds === null) {
        return { valid: false, message: 'Seconds is required' };
    }
    const parsed = Number(seconds);
    if(isNaN(parsed) || parsed <= 0) {
        return { valid: false, message: 'Invalid time' };
    }
    return { valid: true, value: parsed };
}

function validatePagination(query) {
    const page = parseInt(query.page) || 1;
    const limit = 12;
    return { page, limit };
}

function validateLeaderboardParams(query) {
    const type = query.type || 'exp';
    const period = query.period || 'all';
    const limit = parseInt(query.limit) || 50;
    if(!VALID_LEADERBOARD_TYPES.includes(type)) {
        return { valid: false, message: `Invalid type. Must be one of: ${VALID_LEADERBOARD_TYPES.join(', ')}` };
    }
    if(!VALID_PERIODS.includes(period)) {
        return { valid: false, message: `Invalid period. Must be one of: ${VALID_PERIODS.join(', ')}` };
    }
    return { valid: true, type, period, limit };
}

function validateStatisticsParams(query) {
    const type = query.type || 'time';
    const period = query.period || 'week';
    if(!VALID_STATISTIC_TYPES.includes(type)) {
        return { valid: false, message: `Invalid type. Must be one of: ${VALID_STATISTIC_TYPES.join(', ')}` };
    }
    if(!VALID_STATISTIC_PERIODS.includes(period)) {
        return { valid: false, message: `Invalid period. Must be one of: ${VALID_STATISTIC_PERIODS.join(', ')}` };
    }
    return { valid: true, type, period };
}

function validateObjectId(id) {
    if(!id) {
        return { valid: false, message: 'ID is required' };
    }
    if(!/^[0-9a-fA-F]{24}$/.test(id)) {
        return { valid: false, message: 'Invalid ID format' };
    }
    return { valid: true, value: id };
}

module.exports = { validateGoal, validateStudyTime, validatePagination, validateLeaderboardParams, validateStatisticsParams, validateObjectId };