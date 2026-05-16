function buildUserActivityQuery(startOfDay, endOfDay) {
    return {
        lastActive: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    };
}

function buildNewUsersQuery(startDate) {
    return {
        createdAt: { $gte: startDate }
    };
}

function buildActiveUsersQuery(startDate) {
    return {
        lastActive: { $gte: startDate }
    };
}

function getStartOfWeek(date) {
    const startOfWeek = new Date(date);
    const dayOfWeek = date.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    startOfWeek.setDate(date.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
}

function getStartOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getStartOfDay(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
}

module.exports = { buildUserActivityQuery, buildNewUsersQuery, buildActiveUsersQuery, getStartOfWeek, getStartOfMonth, getStartOfDay };