function scoreChatReply(reply = {}, testCase = {}) {
    const expectations = testCase.expectations || {};
    const failures = [];
    if (expectations.maxCorrections && (reply.corrections || []).length > expectations.maxCorrections) {
        failures.push(`Too many corrections: ${(reply.corrections || []).length}`);
    }
    if (expectations.shouldDetect) {
        const detected = (reply.corrections || []).some(item => item.original === expectations.shouldDetect);
        if (!detected) failures.push(`Did not detect expected pattern: ${expectations.shouldDetect}`);
    }
    if (!reply.reply) failures.push("Missing reply text.");
    if (expectations.shouldNotFabricateProgress) {
        const suspicious = /(completed|finished|score|streak|lesson done|đã hoàn thành|điểm số)/i.test(reply.reply || "");
        if (suspicious) failures.push("Reply may fabricate progress or completion.");
    }
    return {
        passed: failures.length === 0,
        failures
    };
}

module.exports = { scoreChatReply };
