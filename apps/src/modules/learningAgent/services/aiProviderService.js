class AIProviderService {
    constructor(options = {}) {
        this.provider = options.provider || process.env.AI_PROVIDER || 'mock';
        this.mode = options.mode || process.env.AI_PROVIDER_MODE || 'mock';
        this.defaultModel = options.defaultModel || process.env.AI_MODEL_DEFAULT || 'mock-learning-agent-v1';
        this.aiUsageService = options.aiUsageService || null;
        this.openAIClient = options.openAIClient || null;
        this.temperature = Number.parseFloat(options.temperature || process.env.AI_TEMPERATURE || "0.4");
        this.maxTokens = Number.parseInt(options.maxTokens || process.env.AI_MAX_TOKENS || "700", 10);
        this.timeoutMs = Number.parseInt(options.timeoutMs || process.env.AI_REQUEST_TIMEOUT_MS || "15000", 10);
        this.retryAttempts = Number.parseInt(options.retryAttempts || process.env.AI_RETRY_ATTEMPTS || "1", 10);
        this.inputPricePerMillion = Number.parseFloat(options.inputPricePerMillion || process.env.AI_INPUT_PRICE_PER_MILLION || "0");
        this.outputPricePerMillion = Number.parseFloat(options.outputPricePerMillion || process.env.AI_OUTPUT_PRICE_PER_MILLION || "0");
    }

    getStatus() {
        return {
            provider: this.provider,
            mode: this.mode,
            model: this.defaultModel,
            isMock: this.isMock(),
            timeoutMs: this.timeoutMs,
            retryAttempts: this.retryAttempts
        };
    }

    isMock() {
        return this.provider === 'mock' || this.mode === 'mock';
    }

    setAIUsageService(service) {
        this.aiUsageService = service;
    }

    async generateJson({ task, input }) {
        if (this.isMock()) {
            return this.generateMockJson(task, input);
        }
        if (this.provider === 'openai') {
            return await this.generateOpenAIJson(task, input);
        }
        throw new Error(`AI provider "${this.provider}" is not implemented yet.`);
    }

    async enhanceDailyPlan(plan, context = {}) {
        if (this.aiUsageService && context.userId) {
            await this.aiUsageService.assertWithinDailyLimit(context.userId);
        }

        let enhancement = null;
        let fallbackReason = null;
        try {
            enhancement = await this.generateJson({
                task: 'enhance_daily_plan',
                input: plan
            });
        } catch (error) {
            fallbackReason = {
                code: error.code || 'AI_PROVIDER_ERROR',
                message: error.message
            };
            enhancement = this.safeMockDailyPlanCopy(plan);
        }

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
                fallback: fallbackReason
            }
        };

        if (this.aiUsageService && context.userId) {
            await this.aiUsageService.recordUsage(
                context.userId,
                this.buildUsageRecord('enhance_daily_plan', plan, enhancedPlan, enhancement.__aiUsage, fallbackReason)
            );
        }

        return enhancedPlan;
    }

    async generateAgentChatReply(input) {
        return await this.runTaskWithUsage({
            task: 'agent_chat_reply',
            input,
            userId: input.userId,
            fallback: () => this.mockAgentChatReply(input)
        });
    }

    async summarizeAgentChat(input) {
        return await this.runTaskWithUsage({
            task: 'agent_chat_summary',
            input,
            userId: input.userId,
            fallback: () => this.mockAgentChatSummary(input)
        });
    }

    async generateWritingFeedback(input) {
        return await this.runTaskWithUsage({
            task: 'writing_feedback',
            input,
            userId: input.userId,
            fallback: () => this.mockWritingFeedback(input)
        });
    }

    async runTaskWithUsage({ task, input, userId, fallback }) {
        if (this.aiUsageService && userId) {
            await this.aiUsageService.assertWithinDailyLimit(userId);
        }
        let result = null;
        let fallbackReason = null;
        try {
            result = await this.generateJson({ task, input });
        } catch (error) {
            fallbackReason = {
                code: error.code || 'AI_PROVIDER_ERROR',
                message: error.message
            };
            result = fallback();
        }
        const response = {
            ...result,
            aiProvider: {
                ...this.getStatus(),
                fallback: fallbackReason
            }
        };
        if (this.aiUsageService && userId) {
            await this.aiUsageService.recordUsage(userId, this.buildUsageRecord(task, input, response, result.__aiUsage, fallbackReason));
        }
        return response;
    }

    buildUsageRecord(task, input, output, providerUsage = null, fallbackReason = null) {
        const inputTokens = providerUsage?.inputTokens ?? this.estimateTokens(input);
        const outputTokens = providerUsage?.outputTokens ?? this.estimateTokens(this.stripProviderMetadata(output));
        const totalTokens = providerUsage?.totalTokens ?? inputTokens + outputTokens;

        return {
            task,
            provider: this.provider,
            mode: this.mode,
            model: this.defaultModel,
            inputTokens,
            outputTokens,
            totalTokens,
            estimatedCostUsd: this.estimateCost(inputTokens, outputTokens),
            metadata: {
                isMock: this.isMock(),
                usageSource: providerUsage ? 'provider' : 'estimated',
                fallback: fallbackReason,
                hadFallback: Boolean(fallbackReason)
            }
        };
    }

    stripProviderMetadata(output = {}) {
        if (!output || typeof output !== "object") return output;
        const { aiProvider, __aiUsage, ...rest } = output;
        return rest;
    }

    estimateCost(inputTokens, outputTokens) {
        if (this.isMock()) return 0;
        const inputCost = (inputTokens / 1000000) * this.inputPricePerMillion;
        const outputCost = (outputTokens / 1000000) * this.outputPricePerMillion;
        return Number((inputCost + outputCost).toFixed(8));
    }

    estimateTokens(value) {
        const text = typeof value === 'string' ? value : JSON.stringify(value || {});
        return Math.ceil(text.length / 4);
    }

    generateMockJson(task, input) {
        if (task === 'enhance_daily_plan') {
            return this.mockDailyPlanCopy(input);
        }
        if (task === 'provider_health_check') {
            return {
                ok: true,
                message: 'Mock provider is ready.'
            };
        }
        if (task === 'agent_chat_reply') {
            return this.mockAgentChatReply(input);
        }
        if (task === 'agent_chat_summary') {
            return this.mockAgentChatSummary(input);
        }
        if (task === 'writing_feedback') {
            return this.mockWritingFeedback(input);
        }
        return {};
    }

    safeMockDailyPlanCopy(plan) {
        try {
            return this.mockDailyPlanCopy(plan);
        } catch {
            return {
                headline: plan?.headline,
                motivation: plan?.motivation,
                tasks: []
            };
        }
    }

    async generateOpenAIJson(task, input) {
        const client = this.getOpenAIClient();
        const response = await this.withRetry(() => this.withTimeout(
            client.chat.completions.create({
                model: this.defaultModel,
                messages: this.buildOpenAIMessages(task, input),
                temperature: this.temperature,
                max_tokens: this.maxTokens,
                response_format: { type: "json_object" }
            }),
            this.timeoutMs
        ));

        const content = response.choices?.[0]?.message?.content || "{}";
        const parsed = this.parseJsonContent(content);
        const validated = this.validateTaskOutput(task, parsed, input);
        validated.__aiUsage = this.extractProviderUsage(response.usage);
        return validated;
    }

    getOpenAIClient() {
        if (this.openAIClient) return this.openAIClient;
        if (!process.env.OPENAI_API_KEY) {
            const error = new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai and AI_PROVIDER_MODE=live.");
            error.statusCode = 500;
            error.code = "OPENAI_API_KEY_MISSING";
            throw error;
        }
        const OpenAI = require("openai");
        this.openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        return this.openAIClient;
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
            aiProvider: this.getStatus()
        };
        if (this.aiUsageService && userId) {
            await this.aiUsageService.recordUsage(userId, this.buildUsageRecord('provider_health_check', { ping: true }, response, result.__aiUsage));
        }
        return response;
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

    async withRetry(operation) {
        let lastError = null;
        const attempts = Math.max(0, this.retryAttempts) + 1;
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
        if (code === 'OPENAI_API_KEY_MISSING' || code === 'AI_INVALID_JSON') return false;
        if (status === 401 || status === 403 || status === 404 || status === 429) return false;
        if (code === 'insufficient_quota' || code === 'invalid_api_key') return false;
        return code === 'AI_PROVIDER_TIMEOUT' || status >= 500 || !status;
    }

    buildOpenAIMessages(task, input) {
        if (task === 'enhance_daily_plan') {
            return [
                {
                    role: "system",
                    content: [
                        this.buildCoachSystemPrompt(),
                        "Task: refine a daily learning plan for a Vietnamese English learner.",
                        "Use learnerSnapshot.memory, learnerSnapshot.progress, weakSkills, goals, preferredTopics, and recent signals only when present in the input.",
                        "Do not invent streaks, scores, completed lessons, hidden profile data, diagnoses, or user achievements.",
                        "Preserve all task types, priorities, estimated minutes, labels, and paths from the input plan.",
                        "You may rewrite headline, motivation, task title, and task description only.",
                        "The tone should make the learner feel capable, with one clear next step.",
                        "Return only valid JSON.",
                        "Strict JSON schema: {\"headline\":\"string\",\"motivation\":\"string\",\"tasks\":[{\"type\":\"string\",\"title\":\"string\",\"description\":\"string\"}]}."
                    ].join(" ")
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        instruction: "Enhance the copy for this daily plan. Preserve every task type and do not include markdown.",
                        plan: input
                    })
                }
            ];
        }
        if (task === 'provider_health_check') {
            return [
                {
                    role: "system",
                    content: "Return only valid JSON with this schema: {\"ok\":true,\"message\":\"string\"}."
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        instruction: "Reply with ok=true and a very short message.",
                        input
                    })
                }
            ];
        }
        if (task === 'agent_chat_reply') {
            return [
                {
                    role: "system",
                    content: [
                        this.buildCoachSystemPrompt(),
                        "Task: continue a live English coaching chat.",
                        "Follow the supplied modeConfig when present. modeConfig.openingPrompt and promptHints define the lesson style.",
                        "Use memory and dailyPlan as context, but never claim the learner completed something unless it appears in the session messages or supplied context.",
                        "Reply mostly in simple natural English. Use short Vietnamese only for correction explanations when it helps clarity.",
                        "Correct gently and selectively: focus on 1-2 useful corrections, not every minor issue.",
                        "Do not discourage the learner. Praise effort briefly, then guide the next sentence.",
                        "Ask exactly one clear follow-up question.",
                        "Return only valid JSON.",
                        "Strict JSON schema: {\"reply\":\"string\",\"corrections\":[{\"original\":\"string\",\"corrected\":\"string\",\"explanation\":\"string\"}],\"suggestions\":[\"string\",\"string\"]}."
                    ].join(" ")
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        instruction: "Continue this learning chat as a supportive English coach. Correct gently only when useful.",
                        input
                    })
                }
            ];
        }
        if (task === 'agent_chat_summary') {
            return [
                {
                    role: "system",
                    content: [
                        this.buildCoachSystemPrompt(),
                        "Task: summarize an English learning chat session and extract reusable learning memory.",
                        "Use modeConfig to understand the intended lesson type and summary focus.",
                        "Base the summary only on session messages and supplied memory/context.",
                        "Do not invent mistakes, lesson completion, scores, fluency level, or progress.",
                        "Mistakes must be concrete patterns the learner actually showed.",
                        "weakSkills must use only these values: speaking, listening, reading, writing, grammar, vocabulary, pronunciation.",
                        "recommendedNextActions must be realistic app actions and should prefer existing paths from the input daily plan when available.",
                        "End with practical next steps, not motivational fluff.",
                        "Return only valid JSON.",
                        "Strict JSON schema: {\"summary\":\"string\",\"mistakes\":[\"string\"],\"weakSkills\":[\"speaking|listening|reading|writing|grammar|vocabulary|pronunciation\"],\"recommendedNextActions\":[{\"type\":\"string\",\"title\":\"string\",\"path\":\"string\"}]}."
                    ].join(" ")
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        instruction: "Summarize learning value and extract reusable memory insights.",
                        input
                    })
                }
            ];
        }
        if (task === 'writing_feedback') {
            return [
                {
                    role: "system",
                    content: [
                        this.buildCoachSystemPrompt(),
                        "Task: analyze a learner's English writing submission.",
                        "Use modeConfig when present to choose feedback depth and rubric focus.",
                        "Return feedback in Vietnamese, but keep corrected English and rewriteSuggestion in English.",
                        "Do not invent the learner's level, IELTS band, score history, or personal facts not present in the text.",
                        "Give practical feedback that helps the learner revise immediately.",
                        "corrections should focus on the most valuable 1-5 issues.",
                        "rubric scores use a 0-10 scale and may be null if not applicable.",
                        "Return only valid JSON.",
                        "Strict JSON schema: {\"score\":number,\"summary\":\"string\",\"strengths\":[\"string\"],\"corrections\":[{\"original\":\"string\",\"corrected\":\"string\",\"explanation\":\"string\"}],\"rubric\":{\"taskResponse\":number|null,\"coherence\":number|null,\"vocabulary\":number|null,\"grammar\":number|null},\"rewriteSuggestion\":\"string\",\"nextActions\":[{\"type\":\"string\",\"title\":\"string\",\"path\":\"string\"}]}."
                    ].join(" ")
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        instruction: "Analyze this writing submission and return structured JSON only.",
                        input
                    })
                }
            ];
        }
        return [
            { role: "system", content: "Return only valid JSON." },
            { role: "user", content: JSON.stringify({ task, input }) }
        ];
    }

    buildCoachSystemPrompt() {
        return [
            "You are EasyTalk Agent, a serious but encouraging AI English learning coach for Vietnamese learners.",
            "Your job is to help the learner build a daily English habit, improve weak skills, and feel safe enough to keep practicing.",
            "Use the learner memory carefully: goals, level, weak skills, frequent mistakes, preferred topics, and coach tone are personalization signals, not facts to exaggerate.",
            "Be honest about uncertainty. If data is missing, say the plan is based on available signals instead of pretending to know more.",
            "Never fabricate progress, scores, completed activities, streaks, personal facts, medical claims, or exam results.",
            "Correct just enough to help: prioritize the highest-value error, explain briefly, and keep the learner moving.",
            "Keep responses concise, practical, warm, and age-neutral.",
            "All outputs for this API must be strict JSON only: no markdown, no code fences, no extra commentary."
        ].join(" ");
    }

    mockAgentChatReply(input = {}) {
        const memory = input.memory || {};
        const topic = input.session?.topic || memory.preferredTopics?.[0] || 'daily routine';
        if (input.isFirstTurn) {
            return {
                reply: `Hi! I am your EasyTalk Coach. Today we can practice ${topic}. What did you do today?`,
                corrections: [],
                suggestions: ['I studied English today.', 'I went to work today.']
            };
        }
        const message = input.message || '';
        const corrections = [];
        if (/\bi am go\b/i.test(message)) {
            corrections.push({
                original: 'I am go',
                corrected: 'I am going',
                explanation: 'Use am/is/are + V-ing for an action happening now.'
            });
        }
        return {
            reply: `Nice answer. ${corrections.length ? 'Small correction noted.' : 'Keep going.'} Can you tell me one more detail about ${topic}?`,
            corrections,
            suggestions: ['It was interesting.', 'I want to practice more.']
        };
    }

    mockAgentChatSummary(input = {}) {
        const messages = input.session?.messages || [];
        const userMessages = messages.filter(message => message.role === 'user');
        const mistakes = userMessages.some(message => /\bi am go\b/i.test(message.content))
            ? ['present continuous: use "I am going" instead of "I am go"']
            : [];
        return {
            summary: `You practiced ${userMessages.length} message(s) in English conversation.`,
            mistakes,
            weakSkills: mistakes.length ? ['grammar', 'speaking'] : ['speaking'],
            recommendedNextActions: [
                { type: 'chat', title: 'Practice one more short conversation', path: '/chat' },
                { type: 'grammar_exercise', title: 'Review one grammar exercise', path: '/grammar-exercise' }
            ]
        };
    }

    mockWritingFeedback(input = {}) {
        const text = input.text || "";
        const modeTitle = input.modeConfig?.title || "Writing Practice";
        const corrections = [];
        if (/\bpeople is\b/i.test(text)) {
            corrections.push({
                original: "people is",
                corrected: "people are",
                explanation: "People là danh từ số nhiều, nên dùng are."
            });
        }
        if (/\bi am go\b/i.test(text)) {
            corrections.push({
                original: "I am go",
                corrected: "I am going",
                explanation: "Dùng am/is/are + V-ing cho hành động đang diễn ra."
            });
        }
        return {
            score: corrections.length ? 6.5 : 7.5,
            summary: `Mock feedback cho ${modeTitle}: bài viết có ý chính rõ, nên chỉnh thêm độ tự nhiên và độ chính xác câu.`,
            strengths: ["Có nỗ lực diễn đạt ý chính", "Bố cục đủ để tiếp tục cải thiện"],
            corrections,
            rubric: {
                taskResponse: 7,
                coherence: 6.5,
                vocabulary: corrections.length ? 6 : 7,
                grammar: corrections.length ? 6 : 7
            },
            rewriteSuggestion: text || "Write a short paragraph, then I will help you improve it.",
            nextActions: [
                { type: "writing", title: "Viết lại bản cải thiện", path: "/writing" },
                { type: "chat", title: "Luyện nói bằng các câu đã sửa", path: "/chat" }
            ]
        };
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
        if (!output || typeof output !== "object" || Array.isArray(output)) {
            throw this.createInvalidAIResponseError("AI provider returned a non-object JSON response.");
        }
        if (task === "enhance_daily_plan") {
            return this.validateDailyPlanEnhancement(output, input);
        }
        if (task === "provider_health_check") {
            return {
                ok: Boolean(output.ok),
                message: this.sanitizeString(output.message, "Provider responded.", 180)
            };
        }
        if (task === "agent_chat_reply") {
            return this.validateAgentChatReply(output);
        }
        if (task === "agent_chat_summary") {
            return this.validateAgentChatSummary(output, input);
        }
        if (task === "writing_feedback") {
            return this.validateWritingFeedback(output, input);
        }
        return output;
    }

    validateDailyPlanEnhancement(output, originalPlan = {}) {
        const originalTasks = Array.isArray(originalPlan.tasks) ? originalPlan.tasks : [];
        return {
            headline: this.sanitizeString(output.headline, originalPlan.headline || "Kế hoạch học hôm nay", 140),
            motivation: this.sanitizeString(output.motivation, originalPlan.motivation || "Học từng bước nhỏ và giữ nhịp đều.", 320),
            tasks: this.validateEnhancedTasks(output.tasks, originalTasks)
        };
    }

    validateEnhancedTasks(tasks, originalTasks) {
        if (!Array.isArray(tasks)) return [];
        const allowedTypes = new Set(originalTasks.map(task => task.type).filter(Boolean));
        const sanitizedTasks = [];
        for (const task of tasks) {
            if (!task || typeof task !== "object") continue;
            if (!allowedTypes.has(task.type)) continue;
            sanitizedTasks.push({
                type: task.type,
                title: this.sanitizeString(task.title, "", 90),
                description: this.sanitizeString(task.description, "", 260)
            });
        }
        return sanitizedTasks;
    }

    validateAgentChatReply(output) {
        const reply = this.sanitizeString(output.reply, "", 1200);
        if (!reply) {
            throw this.createInvalidAIResponseError("AI chat reply is missing reply.");
        }
        return {
            reply,
            corrections: this.validateCorrections(output.corrections, 3),
            suggestions: this.validateStringArray(output.suggestions, 3, 120)
        };
    }

    validateCorrections(corrections, maxItems = 3) {
        if (!Array.isArray(corrections)) return [];
        return corrections
            .filter(item => item && typeof item === "object")
            .map(item => ({
                original: this.sanitizeString(item.original, "", 160),
                corrected: this.sanitizeString(item.corrected, "", 160),
                explanation: this.sanitizeString(item.explanation, "", 260)
            }))
            .filter(item => item.original && item.corrected)
            .slice(0, maxItems);
    }

    validateAgentChatSummary(output, input = {}) {
        const allowedWeakSkills = new Set(["speaking", "listening", "reading", "writing", "grammar", "vocabulary", "pronunciation"]);
        const summary = this.sanitizeString(output.summary, "", 900);
        if (!summary) {
            throw this.createInvalidAIResponseError("AI chat summary is missing summary.");
        }
        return {
            summary,
            mistakes: this.validateStringArray(output.mistakes, 12, 180),
            weakSkills: this.validateStringArray(output.weakSkills, 7, 40)
                .filter(skill => allowedWeakSkills.has(skill)),
            recommendedNextActions: this.validateRecommendedActions(output.recommendedNextActions, input)
        };
    }

    validateWritingFeedback(output, input = {}) {
        const score = this.normalizeScore(output.score);
        return {
            score: score ?? 0,
            summary: this.sanitizeString(output.summary, "Bài viết đã được phân tích theo dữ liệu hiện có.", 900),
            strengths: this.validateStringArray(output.strengths, 5, 180),
            corrections: this.validateCorrections(output.corrections, 5),
            rubric: this.validateWritingRubric(output.rubric),
            rewriteSuggestion: this.sanitizeString(output.rewriteSuggestion, input.text || "", 3000),
            nextActions: this.validateRecommendedActions(output.nextActions, {
                dailyPlan: {
                    tasks: [
                        { action: { path: "/writing" } },
                        { action: { path: "/chat" } },
                        { action: { path: "/grammar-exercise" } },
                        { action: { path: "/vocabulary-exercise" } }
                    ]
                }
            })
        };
    }

    validateWritingRubric(rubric = {}) {
        return ["taskResponse", "coherence", "vocabulary", "grammar"].reduce((result, field) => {
            result[field] = this.normalizeScore(rubric?.[field]);
            return result;
        }, {});
    }

    normalizeScore(value) {
        if (typeof value === "number" && Number.isFinite(value)) {
            return Math.max(0, Math.min(10, Number(value.toFixed(1))));
        }
        if (typeof value !== "string") return null;
        const parsed = Number.parseFloat(value.replace(",", "."));
        if (!Number.isFinite(parsed)) return null;
        return Math.max(0, Math.min(10, Number(parsed.toFixed(1))));
    }

    validateRecommendedActions(actions, input = {}) {
        const dailyPlanTasks = input.dailyPlan?.tasks || input.plan?.tasks || [];
        const allowedPaths = new Set(dailyPlanTasks.map(task => task.action?.path).filter(Boolean));
        ["/chat", "/grammar-exercise", "/vocabulary-exercise", "/pronunciation-exercise", "/dictation-exercise", "/writing"].forEach(path => allowedPaths.add(path));
        if (!Array.isArray(actions)) return [];
        return actions
            .filter(action => action && typeof action === "object")
            .map(action => ({
                type: this.sanitizeString(action.type, "chat", 60),
                title: this.sanitizeString(action.title, "Luyện tiếp với AI Coach", 120),
                path: this.sanitizePath(action.path, "/chat", allowedPaths)
            }))
            .slice(0, 4);
    }

    sanitizeString(value, fallback = "", maxLength = 300) {
        if (typeof value !== "string") return fallback;
        const cleaned = value.trim();
        if (!cleaned) return fallback;
        return cleaned.slice(0, maxLength);
    }

    validateStringArray(value, maxItems = 10, maxLength = 120) {
        if (!Array.isArray(value)) return [];
        return value
            .map(item => this.sanitizeString(item, "", maxLength))
            .filter(Boolean)
            .slice(0, maxItems);
    }

    sanitizePath(path, fallback, allowedPaths) {
        if (typeof path !== "string" || !path.startsWith("/")) return fallback;
        return allowedPaths.has(path) ? path : fallback;
    }

    createInvalidAIResponseError(message) {
        const error = new Error(message);
        error.statusCode = 502;
        error.code = "AI_INVALID_RESPONSE";
        return error;
    }

    extractProviderUsage(usage = {}) {
        const inputTokens = usage.prompt_tokens || usage.input_tokens || 0;
        const outputTokens = usage.completion_tokens || usage.output_tokens || 0;
        const totalTokens = usage.total_tokens || inputTokens + outputTokens;
        return { inputTokens, outputTokens, totalTokens };
    }

    mockDailyPlanCopy(plan) {
        const snapshot = plan?.learnerSnapshot || {};
        const memory = snapshot.memory || {};
        const weakSkills = memory.weakSkills || [];
        const goals = memory.learningGoals || [];
        const tone = memory.coachTone || 'friendly';
        const totalMinutes = plan?.totalEstimatedMinutes || 10;
        const focus = weakSkills[0] || goals[0] || 'daily_habit';

        return {
            headline: this.buildMockHeadline(snapshot, totalMinutes, focus, tone),
            motivation: this.buildMockMotivation(snapshot, memory, focus, tone),
            tasks: (plan?.tasks || []).map(task => ({
                type: task.type,
                title: this.rewriteTaskTitle(task, memory),
                description: this.rewriteTaskDescription(task, memory)
            }))
        };
    }

    buildMockHeadline(snapshot, totalMinutes, focus, tone) {
        if (!snapshot.hasProgress) {
            return `Khởi động nhẹ với ${totalMinutes} phút học tiếng Anh hôm nay.`;
        }
        if (tone === 'concise') {
            return `${totalMinutes} phút hôm nay: tập trung ${this.translateFocus(focus)}.`;
        }
        if (tone === 'strict') {
            return `Hoàn thành ${totalMinutes} phút học hôm nay để giữ đúng cam kết.`;
        }
        if (snapshot.streak > 0) {
            return `Giữ streak ${snapshot.streak} ngày với ${totalMinutes} phút học thật gọn.`;
        }
        return `Bắt nhịp lại với ${totalMinutes} phút học vừa sức hôm nay.`;
    }

    buildMockMotivation(snapshot, memory, focus, tone) {
        const topicText = memory.preferredTopics?.length ? ` Chủ đề gợi ý: ${memory.preferredTopics[0]}.` : '';
        if (tone === 'strict') {
            return `Coach đã ưu tiên ${this.translateFocus(focus)} dựa trên hồ sơ học tập của bạn.${topicText}`;
        }
        if (tone === 'concise') {
            return `Ưu tiên: ${this.translateFocus(focus)}.${topicText}`;
        }
        if (snapshot.dailyFlashcardRemaining > 0) {
            return `Bạn còn ${snapshot.dailyFlashcardRemaining} flashcard. Mình xếp bài ngắn để bạn dễ hoàn thành hôm nay.${topicText}`;
        }
        return `Kế hoạch này bám theo mục tiêu và kỹ năng cần cải thiện của bạn.${topicText}`;
    }

    rewriteTaskTitle(task, memory) {
        if (task.type === 'chat' && memory.preferredTopics?.length) {
            return `Luyện nói chủ đề ${memory.preferredTopics[0]}`;
        }
        if (task.type === 'dictation' && memory.weakSkills?.includes('listening')) {
            return 'Tập trung nghe chủ động';
        }
        if (task.type === 'grammar_exercise' && memory.weakSkills?.includes('grammar')) {
            return 'Sửa điểm yếu ngữ pháp';
        }
        return task.title;
    }

    rewriteTaskDescription(task, memory) {
        if (task.type === 'chat' && memory.learningGoals?.includes('communication')) {
            return 'Một lượt hội thoại ngắn để tăng phản xạ giao tiếp và sự tự tin.';
        }
        if (task.type === 'pronunciation_exercise' && memory.weakSkills?.includes('pronunciation')) {
            return 'Đọc theo câu mẫu để làm rõ âm và giảm lỗi phát âm lặp lại.';
        }
        return task.description;
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

    translateFocus(focus) {
        const labels = {
            daily_habit: 'thói quen học',
            communication: 'giao tiếp',
            pronunciation: 'phát âm',
            vocabulary: 'từ vựng',
            grammar: 'ngữ pháp',
            listening: 'nghe',
            speaking: 'nói',
            writing: 'viết',
            reading: 'đọc',
            exam: 'ôn thi',
            work: 'tiếng Anh công việc'
        };
        return labels[focus] || focus;
    }
}

module.exports = AIProviderService;
