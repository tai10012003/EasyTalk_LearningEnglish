function transformLeaderboardData(leaderboard, formatCallback = null) {
    return leaderboard.map(item => {
        const result = {
            rank: item.rank,
            username: item.username,
            value: formatCallback ? formatCallback(item.value) : Math.round(item.value),
            userId: item._id ? item._id.toString() : item.userId.toString()
        };
        if(item.maxStreak !== undefined) {
            result.maxStreak = item.maxStreak;
        }
        if(formatCallback && item.value !== undefined) {
            result.formattedValue = formatCallback(item.value);
        }
        return result;
    });
}

module.exports = { transformLeaderboardData };