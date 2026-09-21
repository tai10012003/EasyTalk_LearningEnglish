class AILatencyReporter {
    createMeasurement(startedAt = Date.now()) {
        return {
            startedAt,
            finish: () => Date.now() - startedAt
        };
    }
}

module.exports = AILatencyReporter;
