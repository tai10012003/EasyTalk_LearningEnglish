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
    if (expectations.mustExcludeStepTypes?.length) {
        const stepTypes = new Set((guide.steps || []).map(step => step.type));
        for (const type of expectations.mustExcludeStepTypes) {
            if (stepTypes.has(type)) failures.push(`Unexpected guide step type: ${type}`);
        }
    }
    if (expectations.recommendedFlow && guide.recommendedFlow !== expectations.recommendedFlow) {
        failures.push(`Expected recommendedFlow ${expectations.recommendedFlow}, got ${guide.recommendedFlow}.`);
    }
    if (expectations.firstStepType && guide.steps?.[0]?.type !== expectations.firstStepType) {
        failures.push(`Expected first step ${expectations.firstStepType}, got ${guide.steps?.[0]?.type}.`);
    }
    if (expectations.timeStepRecommendedMinutes) {
        const timeStep = (guide.steps || []).find(step => step.type === "time_setup");
        if (timeStep?.recommendedMinutes !== expectations.timeStepRecommendedMinutes) {
            failures.push(`Expected time step recommendedMinutes ${expectations.timeStepRecommendedMinutes}, got ${timeStep?.recommendedMinutes || "none"}.`);
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
