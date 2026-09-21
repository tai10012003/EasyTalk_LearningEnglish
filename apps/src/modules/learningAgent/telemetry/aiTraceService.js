class AITraceService {
    constructor(options = {}) {
        this.enabled = options.enabled ?? process.env.AI_TRACE_ENABLED === 'true';
        this.logger = options.logger || console;
    }

    record(event = {}) {
        if (!this.enabled) return null;
        const trace = {
            timestamp: new Date(),
            ...event
        };
        this.logger.info?.("[AI Trace]", trace);
        return trace;
    }

    recordTaskResult({ task, provider, mode, model, latencyMs, fallbackReason = null, success = true }) {
        return this.record({
            task,
            provider,
            mode,
            model,
            latencyMs,
            success,
            fallback: fallbackReason,
            hadFallback: Boolean(fallbackReason)
        });
    }
}

module.exports = AITraceService;
