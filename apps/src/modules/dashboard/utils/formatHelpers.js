function formatStudyTime(hours) {
    if(hours < 1) {
        const minutes = Math.round(hours * 60);
        return `${minutes} phút`;
    }
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    if(minutes === 0) {
        return `${wholeHours} giờ`;
    }
    return `${wholeHours} giờ ${minutes} phút`;
}

function formatTimeAgo(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if(days > 0) return `${days} ngày trước`;
    if(hours > 0) return `${hours} giờ trước`;
    if(minutes > 0) return `${minutes} phút trước`;
    return `${seconds} giây trước`;
}

module.exports = { formatStudyTime, formatTimeAgo };