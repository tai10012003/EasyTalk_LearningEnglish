function getVietnamDate(date) {
    const vnDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const year = vnDate.getFullYear();
    const month = String(vnDate.getMonth() + 1).padStart(2, '0');
    const day = String(vnDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function convertToVietnamTime(dateString) {
    const date = new Date(dateString);
    const vnDateStr = getVietnamDate(date);
    const [y, m, d] = vnDateStr.split('-');
    const vnDate = new Date(date);
    vnDate.setFullYear(parseInt(y), parseInt(m) - 1, parseInt(d));
    return vnDate;
}

function validateFutureTime(reminderTime) {
    const now = new Date();
    const reminderDate = new Date(reminderTime);
    const nowVN = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const reminderVN = new Date(reminderDate.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    if(reminderVN <= nowVN) {
        throw new Error("Thời gian nhắc nhở phải ở trong tương lai (giờ Việt Nam).");
    }
    return true;
}

function formatVietnamTime(date) {
    return new Date(date).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

module.exports = { getVietnamDate, convertToVietnamTime, validateFutureTime, formatVietnamTime };