const PromptTemplateService = require('./promptTemplateService');
const AIResponseSchemaGuard = require('../schemas/aiResponseSchemaGuard');
const MockAIResponseService = require('./mockAIResponseService');
const ProviderFactory = require('../adapters/providerFactory');
const AICostReporter = require('../telemetry/aiCostReporter');
const AILatencyReporter = require('../telemetry/aiLatencyReporter');
const FallbackReporter = require('../telemetry/fallbackReporter');
const AITraceService = require('../telemetry/aiTraceService');

class AIProviderService {
    constructor(options = {}) {
        this.provider = options.provider || process.env.AI_PROVIDER || 'mock';
        this.mode = options.mode || process.env.AI_PROVIDER_MODE || 'mock';
        this.defaultModel = options.defaultModel || process.env.AI_MODEL_DEFAULT || 'mock-learning-agent-v1';
        this.taskModels = {
            enhance_daily_plan: options.dailyPlanModel || process.env.AI_MODEL_DAILY_PLAN || this.defaultModel,
            agent_chat_reply: options.chatModel || process.env.AI_MODEL_CHAT || this.defaultModel,
            agent_chat_summary: options.summaryModel || process.env.AI_MODEL_SUMMARY || this.defaultModel,
            writing_feedback: options.writingModel || process.env.AI_MODEL_WRITING || this.defaultModel,
            provider_health_check: options.healthCheckModel || process.env.AI_MODEL_HEALTH_CHECK || this.defaultModel
        };
        this.aiUsageService = options.aiUsageService || null;
        this.temperature = Number.parseFloat(options.temperature || process.env.AI_TEMPERATURE || "0.4");
        this.maxTokens = Number.parseInt(options.maxTokens || process.env.AI_MAX_TOKENS || "700", 10);
        this.timeoutMs = Number.parseInt(options.timeoutMs || process.env.AI_REQUEST_TIMEOUT_MS || "15000", 10);
        this.taskTimeoutMs = {
            enhance_daily_plan: Number.parseInt(options.dailyPlanTimeoutMs || process.env.AI_DAILY_PLAN_TIMEOUT_MS || this.timeoutMs, 10),
            agent_chat_reply: Number.parseInt(options.chatTimeoutMs || process.env.AI_CHAT_TIMEOUT_MS || this.timeoutMs, 10),
            agent_chat_summary: Number.parseInt(options.summaryTimeoutMs || process.env.AI_SUMMARY_TIMEOUT_MS || this.timeoutMs, 10),
            writing_feedback: Number.parseInt(options.writingTimeoutMs || process.env.AI_WRITING_TIMEOUT_MS || this.timeoutMs, 10),
            provider_health_check: Number.parseInt(options.healthCheckTimeoutMs || process.env.AI_HEALTH_CHECK_TIMEOUT_MS || this.timeoutMs, 10)
        };
        this.retryAttempts = Number.parseInt(options.retryAttempts || process.env.AI_RETRY_ATTEMPTS || "1", 10);
        this.taskRetryAttempts = {
            enhance_daily_plan: Number.parseInt(options.dailyPlanRetryAttempts || process.env.AI_DAILY_PLAN_RETRY_ATTEMPTS || "0", 10),
            agent_chat_reply: Number.parseInt(options.chatRetryAttempts || process.env.AI_CHAT_RETRY_ATTEMPTS || this.retryAttempts, 10),
            agent_chat_summary: Number.parseInt(options.summaryRetryAttempts || process.env.AI_SUMMARY_RETRY_ATTEMPTS || this.retryAttempts, 10),
            writing_feedback: Number.parseInt(options.writingRetryAttempts || process.env.AI_WRITING_RETRY_ATTEMPTS || this.retryAttempts, 10),
            provider_health_check: Number.parseInt(options.healthCheckRetryAttempts || process.env.AI_HEALTH_CHECK_RETRY_ATTEMPTS || this.retryAttempts, 10)
        };
        this.inputPricePerMillion = Number.parseFloat(options.inputPricePerMillion || process.env.AI_INPUT_PRICE_PER_MILLION || "0");
        this.outputPricePerMillion = Number.parseFloat(options.outputPricePerMillion || process.env.AI_OUTPUT_PRICE_PER_MILLION || "0");
        this.promptTemplateService = options.promptTemplateService || new PromptTemplateService();
        this.aiResponseValidatorService = options.aiResponseValidatorService || options.aiResponseSchemaGuard || new AIResponseSchemaGuard();
        this.mockAIResponseService = options.mockAIResponseService || new MockAIResponseService();
        this.providerRegistry = options.providerRegistry || ProviderFactory.createRegistry(options);
        this.aiCostReporter = options.aiCostReporter || new AICostReporter();
        this.aiLatencyReporter = options.aiLatencyReporter || new AILatencyReporter();
        this.fallbackReporter = options.fallbackReporter || new FallbackReporter();
        this.aiTraceService = options.aiTraceService || new AITraceService();
    }

    getStatus() {
        return {
            provider: this.provider,
            mode: this.mode,
            model: this.defaultModel,
            taskModels: this.taskModels,
            isMock: this.isMock(),
            timeoutMs: this.timeoutMs,
            taskTimeoutMs: this.taskTimeoutMs,
            retryAttempts: this.retryAttempts,
            taskRetryAttempts: this.taskRetryAttempts
        };
    }

    getRegisteredProviders() {
        return this.providerRegistry?.listKeys ? this.providerRegistry.listKeys() : [];
    }

    isMock() {
        return this.provider === 'mock' || this.mode === 'mock';
    }

    setAIUsageService(service) {
        this.aiUsageService = service;
    }

    async generateJson({ task, input }) {
        const model = this.getModelForTask(task);
        if (this.isMock()) {
            const result = this.mockAIResponseService.generateJson(task, input);
            result.__aiModel = model;
            return result;
        }
        const adapter = this.providerRegistry.require(this.provider);
        return await this.generateProviderJson(adapter, task, input, model);
    }

    async enhanceDailyPlan(plan, context = {}) {
        if (this.aiUsageService && context.userId) {
            await this.aiUsageService.assertWithinDailyLimit(context.userId);
        }

        let enhancement = null;
        let fallbackReason = null;
        const latency = this.aiLatencyReporter.createMeasurement();
        try {
            enhancement = await this.generateJson({
                task: 'enhance_daily_plan',
                input: plan
            });
        } catch (error) {
            fallbackReason = this.fallbackReporter.normalize(error);
            enhancement = this.mockAIResponseService.safeDailyPlanCopy(plan);
        }
        const latencyMs = latency.finish();

        const enhancedPlan = {
            ...plan,
            headline: enhancement.headline || plan.headline,
            motivation: enhancement.motivation || plan.motivation,
            tasks: Array.isArray(enhancement.tasks) && enhancement.tasks.length
                ? this.mergeTaskCopy(plan.tasks, enhancement.tasks)
                : plan.tasks,
            mode: `${plan.mode}+${fallbackReason ? 'fallback-mock-ai' : (this.isMock() ? 'mock-ai' : this.provider)}`,
            aiProvider: {
                ...this.getStatus(),
                model: this.getModelForTask('enhance_daily_plan'),
                fallback: fallbackReason
            }
        };
        this.traceTaskResult('enhance_daily_plan', latencyMs, fallbackReason);

        if (this.aiUsageService && context.userId) {
            await this.aiUsageService.recordUsage(
                context.userId,
                this.buildUsageRecord('enhance_daily_plan', plan, enhancedPlan, enhancement.__aiUsage, fallbackReason, latencyMs, enhancement.__aiModel)
            );
        }

        return enhancedPlan;
    }

    async generateAgentChatReply(input) {
        return await this.runTaskWithUsage({
            task: 'agent_chat_reply',
            input,
            userId: input.userId,
            fallback: () => this.mockAIResponseService.mockAgentChatReply(input)
        });
    }

    async summarizeAgentChat(input) {
        return await this.runTaskWithUsage({
            task: 'agent_chat_summary',
            input,
            userId: input.userId,
            fallback: () => this.mockAIResponseService.mockAgentChatSummary(input)
        });
    }

    async generateWritingFeedback(input) {
        return await this.runTaskWithUsage({
            task: 'writing_feedback',
            input,
            userId: input.userId,
            fallback: () => this.mockAIResponseService.mockWritingFeedback(input)
        });
    }

    async runTaskWithUsage({ task, input, userId, fallback }) {
        if (this.aiUsageService && userId) {
            await this.aiUsageService.assertWithinDailyLimit(userId);
        }
        let result = null;
        let fallbackReason = null;
        const latency = this.aiLatencyReporter.createMeasurement();
        try {
            result = await this.generateJson({ task, input });
        } catch (error) {
            fallbackReason = this.fallbackReporter.normalize(error);
            result = fallback();
        }
        const latencyMs = latency.finish();
        const response = {
            ...result,
            aiProvider: {
                ...this.getStatus(),
                model: this.getModelForTask(task),
                fallback: fallbackReason
            }
        };
        this.traceTaskResult(task, latencyMs, fallbackReason);
        if (this.aiUsageService && userId) {
            await this.aiUsageService.recordUsage(userId, this.buildUsageRecord(task, input, response, result.__aiUsage, fallbackReason, latencyMs, result.__aiModel));
        }
        return response;
    }

    buildUsageRecord(task, input, output, providerUsage = null, fallbackReason = null, latencyMs = null, model = null) {
        const inputTokens = providerUsage?.inputTokens ?? this.estimateTokens(input);
        const outputTokens = providerUsage?.outputTokens ?? this.estimateTokens(this.stripProviderMetadata(output));
        const totalTokens = providerUsage?.totalTokens ?? inputTokens + outputTokens;
        const taskModel = model || this.getModelForTask(task);

        return {
            task,
            provider: this.provider,
            mode: this.mode,
            model: taskModel,
            inputTokens,
            outputTokens,
            totalTokens,
            estimatedCostUsd: this.estimateCost(inputTokens, outputTokens),
            metadata: {
                isMock: this.isMock(),
                promptVersion: this.promptTemplateService.getPromptVersion(task),
                latencyMs,
                usageSource: providerUsage ? 'provider' : 'estimated',
                fallback: fallbackReason,
                hadFallback: this.fallbackReporter.didFallback(fallbackReason)
            }
        };
    }

    stripProviderMetadata(output = {}) {
        if (!output || typeof output !== "object") return output;
        const { aiProvider, __aiUsage, __aiModel, ...rest } = output;
        return rest;
    }

    estimateCost(inputTokens, outputTokens) {
        return this.aiCostReporter.estimate({
            isMock: this.isMock(),
            inputTokens,
            outputTokens,
            inputPricePerMillion: this.inputPricePerMillion,
            outputPricePerMillion: this.outputPricePerMillion
        });
    }

    estimateTokens(value) {
        const text = typeof value === 'string' ? value : JSON.stringify(value || {});
        return Math.ceil(text.length / 4);
    }

    async generateProviderJson(adapter, task, input, model = this.getModelForTask(task)) {
        const response = await this.withRetry(() => this.withTimeout(
            adapter.createJsonCompletion({
                task,
                input,
                model,
                messages: this.buildOpenAIMessages(task, input),
                temperature: this.temperature,
                maxTokens: this.maxTokens
            }),
            this.getTimeoutForTask(task)
        ), task);

        const content = response.choices?.[0]?.message?.content || "{}";
        const parsed = this.parseJsonContent(content);
        const validated = this.validateTaskOutput(task, parsed, input);
        validated.__aiUsage = this.extractProviderUsage(response.usage);
        validated.__aiModel = model;
        return validated;
    }

    async testProvider(userId = null) {
        if (this.aiUsageService && userId) {
            await this.aiUsageService.assertWithinDailyLimit(userId);
        }
        const startedAt = Date.now();
        const result = await this.generateJson({
            task: 'provider_health_check',
            input: {
                expected: 'Return JSON with ok=true and message.'
            }
        });
        const response = {
            ok: Boolean(result.ok),
            message: result.message || 'Provider responded.',
            latencyMs: Date.now() - startedAt,
            aiProvider: {
                ...this.getStatus(),
                model: this.getModelForTask('provider_health_check')
            }
        };
        if (this.aiUsageService && userId) {
            await this.aiUsageService.recordUsage(userId, this.buildUsageRecord('provider_health_check', { ping: true }, response, result.__aiUsage, null, response.latencyMs, result.__aiModel));
        }
        return response;
    }

    traceTaskResult(task, latencyMs, fallbackReason = null) {
        this.aiTraceService.recordTaskResult({
            task,
            provider: this.provider,
            mode: this.mode,
            model: this.getModelForTask(task),
            latencyMs,
            fallbackReason,
            success: !fallbackReason
        });
    }

    async withTimeout(promise, timeoutMs) {
        if (!timeoutMs || timeoutMs <= 0) return await promise;
        let timer = null;
        try {
            return await Promise.race([
                promise,
                new Promise((_, reject) => {
                    timer = setTimeout(() => {
                        const error = new Error(`AI provider timed out after ${timeoutMs}ms.`);
                        error.code = 'AI_PROVIDER_TIMEOUT';
                        error.statusCode = 504;
                        reject(error);
                    }, timeoutMs);
                })
            ]);
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    getModelForTask(task) {
        return this.taskModels[task] || this.defaultModel;
    }

    getTimeoutForTask(task) {
        return this.taskTimeoutMs[task] || this.timeoutMs;
    }

    getRetryAttemptsForTask(task) {
        if (!task) return this.retryAttempts;
        return this.taskRetryAttempts[task] ?? this.retryAttempts;
    }

    async withRetry(operation, task = null) {
        let lastError = null;
        const attempts = Math.max(0, this.getRetryAttemptsForTask(task)) + 1;
        for (let attempt = 1; attempt <= attempts; attempt += 1) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                if (attempt >= attempts || !this.isRetryableError(error)) {
                    throw error;
                }
            }
        }
        throw lastError;
    }

    isRetryableError(error) {
        if (!error) return false;
        const status = error.status || error.statusCode;
        const code = error.code || '';
        if (code === 'OPENAI_API_KEY_MISSING' || code === 'AI_INVALID_JSON' || code === 'AI_PROVIDER_NOT_IMPLEMENTED') return false;
        if (status === 401 || status === 403 || status === 404 || status === 429) return false;
        if (code === 'insufficient_quota' || code === 'invalid_api_key') return false;
        return code === 'AI_PROVIDER_TIMEOUT' || status >= 500 || !status;
    }

    buildOpenAIMessages(task, input) {
        return this.promptTemplateService.buildOpenAIMessages(task, input);
    }

    buildCoachSystemPrompt() {
        return this.promptTemplateService.buildCoachSystemPrompt();
    }

    parseJsonContent(content) {
        const cleaned = content
            .trim()
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```$/i, "")
            .trim();
        try {
            return JSON.parse(cleaned);
        } catch (error) {
            const parseError = new Error("AI provider returned invalid JSON.");
            parseError.statusCode = 502;
            parseError.code = "AI_INVALID_JSON";
            parseError.cause = error;
            throw parseError;
        }
    }

    validateTaskOutput(task, output = {}, input = {}) {
        return this.aiResponseValidatorService.validateTaskOutput(task, output, input);
    }

    extractProviderUsage(usage = {}) {
        const inputTokens = usage.prompt_tokens || usage.input_tokens || 0;
        const outputTokens = usage.completion_tokens || usage.output_tokens || 0;
        const totalTokens = usage.total_tokens || inputTokens + outputTokens;
        return { inputTokens, outputTokens, totalTokens };
    }

    mergeTaskCopy(originalTasks, enhancedTasks) {
        return originalTasks.map(task => {
            const enhanced = enhancedTasks.find(item => item.type === task.type);
            if (!enhanced) return task;
            return {
                ...task,
                title: enhanced.title || task.title,
                description: enhanced.description || task.description
            };
        });
    }

}

module.exports = AIProviderService;
