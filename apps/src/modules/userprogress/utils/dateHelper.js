const { getVietnamDate } = require('../../../shared/utils/dateFormat');

function getDateKeysForPeriod(period) {
    const now = new Date();
    const keys = [];
    if(period === 'week') {
        const dayOfWeek = now.getDay();
        const diffToMonday = (dayOfWeek + 6) % 7;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - diffToMonday);
        for(let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            keys.push(getVietnamDate(d));
        }
    } else if(period === 'month') {
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for(let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            keys.push(getVietnamDate(date));
        }
    } else if(period === 'year') {
        const year = now.getFullYear();
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31);
        for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            keys.push(getVietnamDate(new Date(d)));
        }
    }
    return keys;
}

function getDateKeysForCustomWeek(weekStr) {
    const [year, week] = weekStr.split('-W').map(Number);
    const start = getDateOfISOWeek(week, year);
    const keys = [];
    for(let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        keys.push(getVietnamDate(d));
    }
    return keys;
}

function getDateOfISOWeek(w, y) {
    const simple = new Date(y, 0, 1 + (w - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if(dow <= 4) {
        ISOweekStart.setDate(simple.getDate() - dow + 1);
    } else {
        ISOweekStart.setDate(simple.getDate() + 8 - dow);
    }
    return ISOweekStart;
}

function resolveDateKeys(period, periodKey) {
    let dateKeys = [];
    if(periodKey) {
        if(periodKey.includes('-W')) {
            dateKeys = getDateKeysForCustomWeek(periodKey);
        } else if(/^\d{4}-\d{2}$/.test(periodKey)) {
            const [y, m] = periodKey.split('-').map(Number);
            const daysInMonth = new Date(y, m, 0).getDate();
            for(let d = 1; d <= daysInMonth; d++) {
                dateKeys.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
            }
        } else if(/^\d{4}$/.test(periodKey)) {
            const y = Number(periodKey);
            const start = new Date(y, 0, 1);
            const end = new Date(y, 11, 31);
            for(let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                dateKeys.push(getVietnamDate(new Date(d)));
            }
        }
    } else {
        dateKeys = getDateKeysForPeriod(period);
    }
    return dateKeys;
}

module.exports = { getDateKeysForPeriod, getDateKeysForCustomWeek, getDateOfISOWeek, resolveDateKeys };