function scoreDailyPlan(plan = {}, testCase = {}) {
    const expectations = testCase.expectations || {};
    const failures = [];
    if (expectations.mustIncludeTaskType && !plan.tasks?.some(task => task.type === expectations.mustIncludeTaskType)) {
        failures.push(`Missing task type: ${expectations.mustIncludeTaskType}`);
    }
    if (expectations.mustIncludeTaskTypes?.length) {
        const missingTypes = expectations.mustIncludeTaskTypes.filter(type => !plan.tasks?.some(task => task.type === type));
        if (missingTypes.length) {
            failures.push(`Missing task types: ${missingTypes.join(", ")}`);
        }
    }
    if (expectations.mustIncludeTaskTypeAny?.length && !expectations.mustIncludeTaskTypeAny.some(type => plan.tasks?.some(task => task.type === type))) {
        failures.push(`Missing any task type: ${expectations.mustIncludeTaskTypeAny.join(", ")}`);
    }
    if (expectations.mustStartWithTaskTypeAny?.length && !expectations.mustStartWithTaskTypeAny.includes(plan.tasks?.[0]?.type)) {
        failures.push(`Expected first task to be one of ${expectations.mustStartWithTaskTypeAny.join(", ")}, got ${plan.tasks?.[0]?.type || "none"}.`);
    }
    if (expectations.mustNotIncludeTaskType && plan.tasks?.some(task => task.type === expectations.mustNotIncludeTaskType)) {
        failures.push(`Unexpected task type: ${expectations.mustNotIncludeTaskType}`);
    }
    if (expectations.exactTaskCount && (plan.tasks || []).length !== expectations.exactTaskCount) {
        failures.push(`Expected exactly ${expectations.exactTaskCount} tasks, got ${(plan.tasks || []).length}.`);
    }
    if (expectations.maxTotalMinutes && plan.totalEstimatedMinutes > expectations.maxTotalMinutes) {
        failures.push(`Plan exceeds ${expectations.maxTotalMinutes} minutes.`);
    }
    if (expectations.exactTotalMinutes && plan.totalEstimatedMinutes !== expectations.exactTotalMinutes) {
        failures.push(`Expected ${expectations.exactTotalMinutes} minutes, got ${plan.totalEstimatedMinutes}.`);
    }
    if (expectations.maxTasks && (plan.tasks || []).length > expectations.maxTasks) {
        failures.push(`Expected at most ${expectations.maxTasks} tasks, got ${(plan.tasks || []).length}.`);
    }
    if (expectations.minTasks && (plan.tasks || []).length < expectations.minTasks) {
        failures.push(`Expected at least ${expectations.minTasks} tasks, got ${(plan.tasks || []).length}.`);
    }
    return {
        passed: failures.length === 0,
        failures
    };
}

module.exports = { scoreDailyPlan };
