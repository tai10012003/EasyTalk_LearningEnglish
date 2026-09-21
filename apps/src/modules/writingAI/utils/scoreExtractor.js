function extractOverallScore(aiFeedback) {
    const patterns = [
        /Điểm tổng quan:\s*([\d\.]+)(\/10)?/i,
        /Tổng điểm:\s*([\d\.]+)(\/10)?/i,
        /Overall score:\s*([\d\.]+)(\/10)?/i,
        /Điểm:\s*([\d\.]+)(\/10)?/i
    ];
    for(const pattern of patterns) {
        const match = aiFeedback.match(pattern);
        if(match) {
            const score = match[1];
            const suffix = match[2] || '';
            return score + suffix;
        }
    }
    return "Không xác định";
}

function validateScore(score) {
    if(score === "Không xác định") return true;
    const numericScore = parseFloat(score);
    return !isNaN(numericScore) && numericScore >= 0 && numericScore <= 10;
}

module.exports = { extractOverallScore, validateScore };