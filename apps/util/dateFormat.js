function getVietnamDate(date = new Date()) {
    const vnDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const y = vnDate.getFullYear();
    const m = String(vnDate.getMonth() + 1).padStart(2, '0');
    const d = String(vnDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getYesterdayVietnamDate() {
    const today = new Date();
    const vnToday = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const yesterday = new Date(vnToday);
    yesterday.setDate(yesterday.getDate() - 1);
    return getVietnamDate(yesterday);
}

module.exports = {
    getVietnamDate,
    getYesterdayVietnamDate
};