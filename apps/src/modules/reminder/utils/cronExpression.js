function buildCronExpression (reminderTime, frequency) {
    const date = new Date(reminderTime);
    const min = date.getMinutes();
    const hour = date.getHours();
    const dom = date.getDate();
    const month = date.getMonth() + 1;
    const dow = date.getDay();
    switch(frequency?.toLowerCase()) {
        case "daily":
            return `${min} ${hour} * * *`;
        case "weekly":
            return `${min} ${hour} * * ${dow}`;
        case "monthly":
            return `${min} ${hour} ${dom} * *`;
        default:
            return `${min} ${hour} ${dom} ${month} *`;
    }
}

module.exports = { buildCronExpression };