const { getVietnamDate } = require('../../../shared/utils/dateFormat');

function calculateStreak(studyDates, todayStr = getVietnamDate()) {
    if(!Array.isArray(studyDates) || studyDates.length === 0) {
        return { currentStreak: 0, tempMaxStreak: 0 };
    }
    const dates = [...new Set(studyDates)].map(d => d instanceof Date ? getVietnamDate(d) : d).filter(Boolean).sort().reverse();
    let streak = 0;
    let tempMaxStreak = 0;
    for(let i = 0; i < dates.length; i++) {
        if(i === 0) {
            streak = 1;
        }else {
            const currentDate = new Date(dates[i] + 'T00:00:00+07:00');
            const prevDate = new Date(dates[i - 1] + 'T00:00:00+07:00');
            const diffDays = (prevDate - currentDate) / (1000 * 60 * 60 * 24);
            if(diffDays === 1 || diffDays === 2) {
                streak++;
            } else {
                break;
            }
        }
        tempMaxStreak = Math.max(tempMaxStreak, streak);
    }
    return { currentStreak: streak, tempMaxStreak };
}

function calculatePerfectStreak(studyDates, todayStr = getVietnamDate()) {
    if(!Array.isArray(studyDates) || studyDates.length === 0) {
        return 0;
    }
    const dates = [...new Set(studyDates)].map(d => (d instanceof Date ? getVietnamDate(d) : d)).filter(Boolean).sort().reverse();
    const today = new Date(todayStr + 'T00:00:00+07:00');
    const yesterday = new Date(today.getTime() - 86400000);
    const yesterdayStr = getVietnamDate(yesterday);
    if(dates[0] !== todayStr && dates[0] !== yesterdayStr) {
        return 0;
    }
    let perfectStreak = 0;
    let expectedDateObj = new Date(dates[0] + 'T00:00:00+07:00');
    for(let i = 0; i < dates.length; i++) {
        const currentDateStr = dates[i];
        const currentDateObj = new Date(currentDateStr + 'T00:00:00+07:00');
        if(currentDateObj.getTime() === expectedDateObj.getTime()) {
            perfectStreak++;
            expectedDateObj = new Date(expectedDateObj.getTime() - 86400000);
        } else {
            break;
        }
    }
    return perfectStreak;
}

module.exports = { calculateStreak, calculatePerfectStreak };