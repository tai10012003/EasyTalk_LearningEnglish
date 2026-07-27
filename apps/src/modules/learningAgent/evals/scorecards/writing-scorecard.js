function scoreWritingFeedback(feedback = {}, testCase = {}) {
    const expectations = testCase.expectations || {};
    const failures = [];
    if (expectations.minCorrections && (feedback.corrections || []).length < expectations.minCorrections) {
        failures.push(`Expected at least ${expectations.minCorrections} correction(s).`);
    }
    if (expectations.scoreMax !== undefined && Number(feedback.score) > expectations.scoreMax) {
        failures.push(`Score is higher than expected max ${expectations.scoreMax}.`);
    }
    if (expectations.maxCorrections !== undefined && (feedback.corrections || []).length > expectations.maxCorrections) {
        failures.push(`Too many corrections: ${(feedback.corrections || []).length}`);
    }
    if (expectations.minStrengths && (feedback.strengths || []).length < expectations.minStrengths) {
        failures.push(`Expected at least ${expectations.minStrengths} strength(s).`);
    }
    if (expectations.requiresRewrite && !feedback.rewriteSuggestion) {
        failures.push("Missing rewriteSuggestion.");
    }
    if (expectations.requiresRubricFields?.length) {
        for (const field of expectations.requiresRubricFields) {
            if (feedback.rubric?.[field] === undefined || feedback.rubric?.[field] === null) {
                failures.push(`Missing rubric field: ${field}`);
            }
        }
    }
    return {
        passed: failures.length === 0,
        failures
    };
}

module.exports = { scoreWritingFeedback };
