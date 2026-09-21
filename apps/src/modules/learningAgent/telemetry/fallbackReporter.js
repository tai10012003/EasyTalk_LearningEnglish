class FallbackReporter {
    normalize(error = null) {
        if (!error) return null;
        return {
            code: error.code || 'AI_PROVIDER_ERROR',
            message: error.message
        };
    }

    didFallback(fallbackReason = null) {
        return Boolean(fallbackReason);
    }
}

module.exports = FallbackReporter;
