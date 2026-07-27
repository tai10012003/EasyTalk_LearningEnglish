function scoreStudyGuide(guide = {}, testCase = {}) {
    const expectations = testCase.expectations || {};
    const failures = [];
    if (expectations.targetMinutes && guide.targetMinutes !== expectations.targetMinutes) {
        failures.push(`Expected targetMinutes ${expectations.targetMinutes}, got ${guide.targetMinutes}.`);
    }
    if (expectations.mustIncludeStepTypes?.length) {
        const stepTypes = new Set((guide.steps || []).map(step => step.type));
        for (const type of expectations.mustIncludeStepTypes) {
            if (!stepTypes.has(type)) failures.push(`Missing guide step type: ${type}`);
        }
    }
    if (expectations.mustRecommendFirstPath && guide.recommendedFirstAction?.path !== expectations.mustRecommendFirstPath) {
        failures.push(`Expected first path ${expectations.mustRecommendFirstPath}, got ${guide.recommendedFirstAction?.path}.`);
    }
    return {
        passed: failures.length === 0,
        failures
    };
}

module.exports = { scoreStudyGuide };
