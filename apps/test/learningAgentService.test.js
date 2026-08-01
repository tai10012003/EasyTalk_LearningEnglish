const test = require('node:test');
const assert = require('node:assert/strict');
const LearningAgentService = require('../src/modules/learningAgent/services/learningAgentService');
const LearnerMemoryService = require('../src/modules/learningAgent/services/learnerMemoryService');
const AIProviderService = require('../src/modules/learningAgent/services/aiProviderService');
const AIUsageService = require('../src/modules/learningAgent/services/aiUsageService');
const AIProviderDebugService = require('../src/modules/learningAgent/services/aiProviderDebugService');
const DailyPlanCacheService = require('../src/modules/learningAgent/services/dailyPlanCacheService');
const AgentSessionService = require('../src/modules/learningAgent/services/agentSessionService');
const AgentLearningEventService = require('../src/modules/learningAgent/services/agentLearningEventService');
const AgentModeService = require('../src/modules/learningAgent/services/agentModeService');
const StudyGuideAgent = require('../src/modules/learningAgent/agents/studyGuideAgent');
const { getVietnamDate } = require('../src/shared/utils/dateFormat');

function createService(progress, memory = null) {
    return new LearningAgentService({
        userProgressService: {
            async getUserProgressByUserId() {
                return progress;
            }
        },
        learnerMemoryService: {
            async getOrCreateMemory() {
                return memory;
            }
        },
        aiProviderService: new AIProviderService()
    });
}

test('daily plan uses user progress to prioritize remaining flashcards', async () => {
    const today = getVietnamDate();
    const service = createService({
        streak: 5,
        maxStreak: 7,
        experiencePoints: 120,
        diamonds: 4,
        dailyFlashcardGoal: 20,
        dailyFlashcardReviews: { [today]: 12 },
        dailyStudyTimes: { [today]: 300 },
        unlockedDictations: ['dictation-1'],
        unlockedGrammarExercises: ['grammar-exercise-1'],
        unlockedPronunciationExercises: ['pronunciation-exercise-1']
    }, {
        learningGoals: ['flashcard_practice'],
        weakSkills: [],
        frequentMistakes: []
    });

    const plan = await service.getDailyPlan('user-1', { targetMinutes: 12 });

    assert.equal(plan.mode, 'rule-based+mock-ai');
    assert.equal(plan.aiProvider.isMock, true);
    assert.equal(plan.learnerSnapshot.streak, 5);
    assert.equal(plan.learnerSnapshot.dailyFlashcardRemaining, 8);
    assert.equal(plan.tasks[0].type, 'flashcard');
    assert.ok(plan.tasks.length <= 3);
    assert.ok(plan.totalEstimatedMinutes > 0);
});

test('daily plan distributes tasks to match selected target minutes', async () => {
    const today = getVietnamDate();
    const service = createService({
        streak: 3,
        dailyFlashcardGoal: 20,
        dailyFlashcardReviews: { [today]: 5 },
        unlockedDictations: ['dictation-1'],
        unlockedGrammarExercises: ['grammar-exercise-1'],
        unlockedPronunciationExercises: ['pronunciation-exercise-1']
    });

    const plan = await service.getDailyPlan('user-1', { targetMinutes: 45 });
    const taskMinutes = plan.tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);

    assert.equal(plan.totalEstimatedMinutes, 45);
    assert.equal(taskMinutes, 45);
    assert.equal(plan.headline, 'Bạn muốn học bao lâu hôm nay?');
    assert.ok(plan.tasks.length >= 4);
});

test('daily plan still returns useful tasks when progress is missing', async () => {
    const service = createService(null);

    const plan = await service.getDailyPlan('user-1');

    assert.equal(plan.learnerSnapshot.hasProgress, false);
    assert.equal(plan.headline, 'Bạn muốn học bao lâu hôm nay?');
    assert.ok(plan.tasks.some(task => task.type === 'flashcard'));
    assert.ok(plan.tasks.some(task => task.type === 'chat'));
});

test('daily plan uses learner memory to prioritize weak listening skill', async () => {
    const today = getVietnamDate();
    const service = createService({
        streak: 2,
        dailyFlashcardGoal: 20,
        dailyFlashcardReviews: { [today]: 20 },
        unlockedDictations: ['dictation-1'],
        unlockedGrammarExercises: ['grammar-exercise-1'],
        unlockedPronunciationExercises: ['pronunciation-exercise-1']
    }, {
        proficiencyLevel: 'beginner',
        learningGoals: ['listening'],
        weakSkills: ['listening'],
        preferredTopics: ['travel']
    });

    const plan = await service.getDailyPlan('user-1', { targetMinutes: 12 });

    assert.equal(plan.learnerSnapshot.memory.proficiencyLevel, 'beginner');
    assert.equal(plan.tasks[0].type, 'dictation');
    assert.match(plan.tasks[0].description, /listening/);
});

test('daily plan cache avoids repeated provider calls and invalidates when memory changes', async () => {
    const today = getVietnamDate();
    let memory = {
        proficiencyLevel: 'beginner',
        learningGoals: ['communication'],
        weakSkills: ['listening'],
        preferredTopics: ['travel'],
        memoryVersion: 'learner-memory-v1',
        updatedAt: new Date('2026-07-27T00:00:00.000Z')
    };
    let providerCalls = 0;
    const service = new LearningAgentService({
        userProgressService: {
            async getUserProgressByUserId() {
                return {
                    streak: 1,
                    dailyFlashcardGoal: 20,
                    dailyFlashcardReviews: { [today]: 8 },
                    unlockedDictations: ['dictation-1']
                };
            }
        },
        learnerMemoryService: {
            async getOrCreateMemory() {
                return memory;
            }
        },
        dailyPlanCacheService: new DailyPlanCacheService({
            now: () => new Date('2026-07-27T08:00:00.000Z')
        }),
        aiProviderService: {
            async enhanceDailyPlan(plan) {
                providerCalls += 1;
                return {
                    ...plan,
                    headline: `${plan.headline} #${providerCalls}`,
                    mode: `${plan.mode}+custom-ai`,
                    aiProvider: { provider: 'custom', isMock: false }
                };
            }
        }
    });

    const firstPlan = await service.getDailyPlan('user-1', { targetMinutes: 20 });
    const secondPlan = await service.getDailyPlan('user-1', { targetMinutes: 20 });
    memory = { ...memory, weakSkills: ['grammar'], updatedAt: new Date('2026-07-27T09:00:00.000Z') };
    const thirdPlan = await service.getDailyPlan('user-1', { targetMinutes: 20 });

    assert.equal(providerCalls, 2);
    assert.equal(firstPlan.headline, secondPlan.headline);
    assert.equal(secondPlan.aiProvider.cache.hit, true);
    assert.equal(thirdPlan.aiProvider.cache.hit, false);
    assert.notEqual(thirdPlan.headline, secondPlan.headline);
});

test('daily plan cache can reuse shared cache across service instances', async () => {
    const today = getVietnamDate();
    const sharedStore = new Map();
    const sharedCache = {
        async get(key) {
            return sharedStore.get(key);
        },
        async set(key, ttl, value, options) {
            sharedStore.set(key, { ...value, ttl, tags: options.tags });
        }
    };
    const progressService = {
        async getUserProgressByUserId() {
            return {
                streak: 1,
                dailyFlashcardGoal: 20,
                dailyFlashcardReviews: { [today]: 10 },
                unlockedDictations: ['dictation-1']
            };
        }
    };
    const memoryService = {
        async getOrCreateMemory() {
            return {
                proficiencyLevel: 'beginner',
                learningGoals: ['communication'],
                weakSkills: ['listening'],
                memoryVersion: 'learner-memory-v1',
                updatedAt: new Date('2026-07-27T00:00:00.000Z')
            };
        }
    };
    let providerCalls = 0;
    const aiProviderService = {
        async enhanceDailyPlan(plan) {
            providerCalls += 1;
            return {
                ...plan,
                headline: `Shared cache plan #${providerCalls}`,
                mode: `${plan.mode}+custom-ai`,
                aiProvider: { provider: 'custom', isMock: false }
            };
        }
    };

    const firstService = new LearningAgentService({
        userProgressService: progressService,
        learnerMemoryService: memoryService,
        aiProviderService,
        dailyPlanCacheService: new DailyPlanCacheService({
            cacheService: sharedCache,
            store: new Map(),
            now: () => new Date('2026-07-27T08:00:00.000Z')
        })
    });
    const secondService = new LearningAgentService({
        userProgressService: progressService,
        learnerMemoryService: memoryService,
        aiProviderService,
        dailyPlanCacheService: new DailyPlanCacheService({
            cacheService: sharedCache,
            store: new Map(),
            now: () => new Date('2026-07-27T08:01:00.000Z')
        })
    });

    const firstPlan = await firstService.getDailyPlan('user-1', { targetMinutes: 30 });
    const secondPlan = await secondService.getDailyPlan('user-1', { targetMinutes: 30 });

    assert.equal(providerCalls, 1);
    assert.equal(firstPlan.headline, secondPlan.headline);
    assert.equal(secondPlan.aiProvider.cache.hit, true);
    assert.ok([...sharedStore.values()][0].tags.some(tag => tag.includes('learningAgent:dailyPlan')));
});

test('mock AI provider enhances daily plan copy without external calls', async () => {
    const provider = new AIProviderService();
    const enhanced = await provider.enhanceDailyPlan({
        headline: 'Original headline',
        motivation: 'Original motivation',
        mode: 'rule-based',
        totalEstimatedMinutes: 8,
        learnerSnapshot: {
            hasProgress: true,
            streak: 4,
            dailyFlashcardRemaining: 0,
            memory: {
                coachTone: 'concise',
                learningGoals: ['communication'],
                weakSkills: ['speaking'],
                preferredTopics: ['travel']
            }
        },
        tasks: [
            {
                type: 'chat',
                title: 'Nói chuyện với AI 3 phút',
                description: 'Old description',
                estimatedMinutes: 3,
                priority: 'high',
                action: { label: 'Bắt đầu chat', path: '/chat' }
            }
        ]
    });

    assert.equal(enhanced.mode, 'rule-based+mock-ai');
    assert.equal(enhanced.aiProvider.provider, 'mock');
    assert.equal(enhanced.headline, 'Bạn muốn học bao lâu hôm nay?');
    assert.equal(enhanced.tasks[0].title, 'Luyện nói chủ đề travel');
});

test('mock AI provider records usage when user context is provided', async () => {
    const records = [];
    const usageService = new AIUsageService({
        dailyLimitPerUser: 10,
        repository: {
            async countByUserAndDate() {
                return records.length;
            },
            async insert(record) {
                records.push(record);
                return { insertedId: 'usage-1' };
            },
            async getDailySummary() {
                return { requests: records.length, inputTokens: 0, outputTokens: 0, totalTokens: 0, estimatedCostUsd: 0 };
            }
        }
    });
    const provider = new AIProviderService({ aiUsageService: usageService });

    await provider.enhanceDailyPlan({
        headline: 'Original headline',
        motivation: 'Original motivation',
        mode: 'rule-based',
        totalEstimatedMinutes: 8,
        learnerSnapshot: { hasProgress: true, memory: {} },
        tasks: []
    }, { userId: '64b64c0f4f1a2562d08f9a10' });

    assert.equal(records.length, 1);
    assert.equal(records[0].task, 'enhance_daily_plan');
    assert.equal(records[0].estimatedCostUsd, 0);
    assert.equal(records[0].metadata.promptVersion, 'daily-plan-v1');
    assert.ok(records[0].totalTokens > 0);
});

test('AI usage service blocks requests after daily limit', async () => {
    const usageService = new AIUsageService({
        dailyLimitPerUser: 1,
        repository: {
            async countByUserAndDate() {
                return 1;
            }
        }
    });

    await assert.rejects(
        () => usageService.assertWithinDailyLimit('64b64c0f4f1a2562d08f9a10'),
        (error) => error.code === 'AI_DAILY_LIMIT_REACHED' && error.statusCode === 429
    );
});

test('OpenAI provider enhances plan through injected client and records provider usage', async () => {
    const records = [];
    const usageService = new AIUsageService({
        dailyLimitPerUser: 5,
        repository: {
            async countByUserAndDate() {
                return 0;
            },
            async insert(record) {
                records.push(record);
                return { insertedId: 'usage-1' };
            }
        }
    });
    const fakeOpenAIClient = {
        chat: {
            completions: {
                async create(payload) {
                    assert.equal(payload.model, 'gpt-test');
                    assert.equal(payload.response_format.type, 'json_object');
                    return {
                        choices: [
                            {
                                message: {
                                    content: JSON.stringify({
                                        headline: 'OpenAI headline',
                                        motivation: 'OpenAI motivation',
                                        tasks: [
                                            {
                                                type: 'chat',
                                                title: 'OpenAI chat task',
                                                description: 'OpenAI chat description'
                                            }
                                        ]
                                    })
                                }
                            }
                        ],
                        usage: {
                            prompt_tokens: 100,
                            completion_tokens: 40,
                            total_tokens: 140
                        }
                    };
                }
            }
        }
    };
    const provider = new AIProviderService({
        provider: 'openai',
        mode: 'live',
        defaultModel: 'gpt-test',
        openAIClient: fakeOpenAIClient,
        aiUsageService: usageService,
        inputPricePerMillion: 1,
        outputPricePerMillion: 6
    });

    const enhanced = await provider.enhanceDailyPlan({
        headline: 'Original headline',
        motivation: 'Original motivation',
        mode: 'rule-based',
        totalEstimatedMinutes: 8,
        learnerSnapshot: { hasProgress: true, memory: {} },
        tasks: [
            {
                type: 'chat',
                title: 'Nói chuyện với AI',
                description: 'Old description',
                estimatedMinutes: 3,
                priority: 'high',
                action: { label: 'Bắt đầu', path: '/chat' }
            }
        ]
    }, { userId: '64b64c0f4f1a2562d08f9a10' });

    assert.equal(enhanced.mode, 'rule-based+openai');
    assert.equal(enhanced.headline, 'OpenAI headline');
    assert.equal(enhanced.tasks[0].title, 'OpenAI chat task');
    assert.equal(records.length, 1);
    assert.equal(records[0].provider, 'openai');
    assert.equal(records[0].inputTokens, 100);
    assert.equal(records[0].outputTokens, 40);
    assert.equal(records[0].estimatedCostUsd, 0.00034);
});

test('AI provider selects task-specific models for daily plan chat writing and summary', async () => {
    const seenModels = [];
    const provider = new AIProviderService({
        provider: 'custom',
        mode: 'live',
        defaultModel: 'default-model',
        dailyPlanModel: 'daily-model',
        chatModel: 'chat-model',
        writingModel: 'writing-model',
        summaryModel: 'summary-model',
        providerRegistry: {
            require() {
                return {
                    async createJsonCompletion(payload) {
                        seenModels.push(payload.model);
                        const outputs = {
                            enhance_daily_plan: {
                                headline: 'Daily headline',
                                motivation: 'Daily motivation',
                                tasks: []
                            },
                            agent_chat_reply: {
                                reply: 'Hello',
                                corrections: [],
                                suggestions: ['Go on']
                            },
                            writing_feedback: {
                                score: 8,
                                summary: 'Good start',
                                strengths: ['clear idea'],
                                corrections: [],
                                rubric: { taskResponse: 8, coherence: 8, vocabulary: 7, grammar: 7 },
                                rewriteSuggestion: 'Better version',
                                nextActions: [{ type: 'writing', title: 'Write again', path: '/writing' }]
                            },
                            agent_chat_summary: {
                                summary: 'Short session',
                                mistakes: [],
                                weakSkills: [],
                                recommendedNextActions: []
                            }
                        };
                        return {
                            choices: [{ message: { content: JSON.stringify(outputs[payload.task]) } }],
                            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 }
                        };
                    }
                };
            }
        }
    });

    await provider.enhanceDailyPlan({
        headline: 'Original headline',
        motivation: 'Original motivation',
        mode: 'rule-based',
        learnerSnapshot: { hasProgress: true, memory: {} },
        tasks: []
    });
    await provider.generateAgentChatReply({ userId: null, message: 'Hi', messages: [] });
    await provider.generateWritingFeedback({ userId: null, text: 'I go school.' });
    await provider.summarizeAgentChat({ userId: null, messages: [] });

    assert.deepEqual(seenModels, ['daily-model', 'chat-model', 'writing-model', 'summary-model']);
});

test('AI provider can use a registered live adapter without provider-specific branching', async () => {
    const provider = new AIProviderService({
        provider: 'custom',
        mode: 'live',
        defaultModel: 'custom-json-model',
        providerRegistry: {
            require(key) {
                assert.equal(key, 'custom');
                return {
                    async createJsonCompletion(payload) {
                        assert.equal(payload.model, 'custom-json-model');
                        return {
                            choices: [
                                {
                                    message: {
                                        content: JSON.stringify({
                                            ok: true,
                                            message: 'custom ready'
                                        })
                                    }
                                }
                            ],
                            usage: { prompt_tokens: 4, completion_tokens: 3, total_tokens: 7 }
                        };
                    }
                };
            }
        }
    });

    const result = await provider.testProvider();

    assert.equal(result.ok, true);
    assert.equal(result.message, 'custom ready');
    assert.equal(result.aiProvider.provider, 'custom');
});

test('Gemini and Claude provider skeletons are registered for health checks', async () => {
    const geminiProvider = new AIProviderService({
        provider: 'gemini',
        mode: 'live',
        defaultModel: 'gemini-skeleton'
    });
    const claudeProvider = new AIProviderService({
        provider: 'claude',
        mode: 'live',
        defaultModel: 'claude-skeleton'
    });

    const geminiResult = await geminiProvider.testProvider();
    const claudeResult = await claudeProvider.testProvider();

    assert.equal(geminiResult.ok, true);
    assert.match(geminiResult.message, /Gemini provider adapter skeleton/);
    assert.equal(claudeResult.ok, true);
    assert.match(claudeResult.message, /Claude provider adapter skeleton/);
});

test('Gemini skeleton falls back to mock for daily plan content tasks', async () => {
    const provider = new AIProviderService({
        provider: 'gemini',
        mode: 'live',
        defaultModel: 'gemini-skeleton',
        retryAttempts: 1
    });

    const enhanced = await provider.enhanceDailyPlan({
        headline: 'Original headline',
        motivation: 'Original motivation',
        mode: 'rule-based',
        totalEstimatedMinutes: 8,
        learnerSnapshot: {
            hasProgress: true,
            streak: 2,
            dailyFlashcardRemaining: 0,
            memory: { learningGoals: ['communication'], weakSkills: ['speaking'] }
        },
        tasks: [
            {
                type: 'chat',
                title: 'Nói chuyện với AI',
                description: 'Old description',
                estimatedMinutes: 3,
                priority: 'high',
                action: { label: 'Bắt đầu', path: '/chat' }
            }
        ]
    });

    assert.equal(enhanced.mode, 'rule-based+fallback-mock-ai');
    assert.equal(enhanced.aiProvider.fallback.code, 'AI_PROVIDER_NOT_IMPLEMENTED');
    assert.ok(enhanced.headline);
});

test('OpenAI provider requires API key when no client is injected', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const provider = new AIProviderService({
        provider: 'openai',
        mode: 'live',
        defaultModel: 'gpt-test'
    });

    await assert.rejects(
        () => provider.generateJson({ task: 'enhance_daily_plan', input: {} }),
        (error) => error.code === 'OPENAI_API_KEY_MISSING'
    );

    if (originalKey) {
        process.env.OPENAI_API_KEY = originalKey;
    }
});

test('daily plan falls back to mock copy when live provider fails', async () => {
    const provider = new AIProviderService({
        provider: 'openai',
        mode: 'live',
        defaultModel: 'gpt-test',
        openAIClient: {
            chat: {
                completions: {
                    async create() {
                        const error = new Error('Temporary provider failure');
                        error.status = 500;
                        throw error;
                    }
                }
            }
        },
        retryAttempts: 0
    });

    const enhanced = await provider.enhanceDailyPlan({
        headline: 'Original headline',
        motivation: 'Original motivation',
        mode: 'rule-based',
        totalEstimatedMinutes: 8,
        learnerSnapshot: {
            hasProgress: true,
            streak: 2,
            dailyFlashcardRemaining: 0,
            memory: { learningGoals: ['communication'], weakSkills: ['speaking'] }
        },
        tasks: [
            {
                type: 'chat',
                title: 'Nói chuyện với AI',
                description: 'Old description',
                estimatedMinutes: 3,
                priority: 'high',
                action: { label: 'Bắt đầu', path: '/chat' }
            }
        ]
    }, { userId: null });

    assert.equal(enhanced.mode, 'rule-based+fallback-mock-ai');
    assert.equal(enhanced.aiProvider.fallback.code, 'AI_PROVIDER_ERROR');
    assert.ok(enhanced.headline);
});

test('OpenAI provider retries retryable failures once', async () => {
    let calls = 0;
    const provider = new AIProviderService({
        provider: 'openai',
        mode: 'live',
        defaultModel: 'gpt-test',
        retryAttempts: 1,
        openAIClient: {
            chat: {
                completions: {
                    async create() {
                        calls += 1;
                        if (calls === 1) {
                            const error = new Error('Server busy');
                            error.status = 500;
                            throw error;
                        }
                        return {
                            choices: [{ message: { content: JSON.stringify({ ok: true, message: 'ready' }) } }],
                            usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
                        };
                    }
                }
            }
        }
    });

    const result = await provider.testProvider();

    assert.equal(result.ok, true);
    assert.equal(calls, 2);
});

test('OpenAI prompts define strict coach behavior and JSON-only output', () => {
    const provider = new AIProviderService({
        provider: 'openai',
        mode: 'live',
        defaultModel: 'gpt-test',
        openAIClient: {}
    });

    const dailyPlanSystemPrompt = provider.buildOpenAIMessages('enhance_daily_plan', {
        learnerSnapshot: { memory: { weakSkills: ['listening'] } },
        tasks: []
    })[0].content;
    const chatSystemPrompt = provider.buildOpenAIMessages('agent_chat_reply', {
        memory: { frequentMistakes: ['past tense'] },
        session: { messages: [] }
    })[0].content;
    const summarySystemPrompt = provider.buildOpenAIMessages('agent_chat_summary', {
        session: { messages: [] }
    })[0].content;

    assert.match(dailyPlanSystemPrompt, /Never fabricate progress/);
    assert.match(dailyPlanSystemPrompt, /Use learnerSnapshot\.memory/);
    assert.match(dailyPlanSystemPrompt, /Preserve all task types/);
    assert.match(chatSystemPrompt, /Correct gently and selectively/);
    assert.match(chatSystemPrompt, /Ask exactly one clear follow-up question/);
    assert.match(summarySystemPrompt, /Base the summary only on session messages/);
    assert.match(summarySystemPrompt, /Return only valid JSON/);
});

test('AI provider schema guard sanitizes unsafe daily plan task copy', () => {
    const provider = new AIProviderService();

    const validated = provider.validateTaskOutput('enhance_daily_plan', {
        headline: '  Better plan  ',
        motivation: 123,
        tasks: [
            { type: 'chat', title: '  Speak now  ', description: 'Practice one turn.' },
            { type: 'unknown', title: 'Bad task', description: 'Should be ignored.' }
        ]
    }, {
        headline: 'Original headline',
        motivation: 'Original motivation',
        tasks: [
            { type: 'chat', title: 'Old chat', description: 'Old description' }
        ]
    });

    assert.equal(validated.headline, 'Better plan');
    assert.equal(validated.motivation, 'Original motivation');
    assert.equal(validated.tasks.length, 1);
    assert.equal(validated.tasks[0].type, 'chat');
});

test('AI provider schema guard rejects chat reply without reply text', () => {
    const provider = new AIProviderService();

    assert.throws(
        () => provider.validateTaskOutput('agent_chat_reply', {
            corrections: [],
            suggestions: []
        }),
        (error) => error.code === 'AI_INVALID_RESPONSE'
    );
});

test('AI provider schema guard filters invalid summary skills and paths', () => {
    const provider = new AIProviderService();

    const validated = provider.validateTaskOutput('agent_chat_summary', {
        summary: 'The learner practiced speaking.',
        mistakes: ['past tense'],
        weakSkills: ['speaking', 'random-skill'],
        recommendedNextActions: [
            { type: 'chat', title: 'Practice again', path: '/chat' },
            { type: 'external', title: 'Unsafe path', path: 'https://example.com' }
        ]
    }, {
        dailyPlan: {
            tasks: [
                { action: { path: '/chat' } }
            ]
        }
    });

    assert.deepEqual(validated.weakSkills, ['speaking']);
    assert.equal(validated.recommendedNextActions.length, 2);
    assert.equal(validated.recommendedNextActions[0].path, '/chat');
    assert.equal(validated.recommendedNextActions[1].path, '/chat');
});

test('AI provider returns structured writing feedback and records usage', async () => {
    const records = [];
    const usageService = new AIUsageService({
        dailyLimitPerUser: 5,
        repository: {
            async countByUserAndDate() {
                return 0;
            },
            async insert(record) {
                records.push(record);
                return { insertedId: 'usage-1' };
            }
        }
    });
    const provider = new AIProviderService({ aiUsageService: usageService });

    const feedback = await provider.generateWritingFeedback({
        userId: '64b64c0f4f1a2562d08f9a10',
        text: 'People is happy when I am go to school.',
        modeConfig: { title: 'Quick Correction' }
    });

    assert.equal(typeof feedback.score, 'number');
    assert.ok(feedback.summary);
    assert.ok(feedback.corrections.length >= 1);
    assert.ok(feedback.rubric.grammar <= 6);
    assert.equal(records.length, 1);
    assert.equal(records[0].task, 'writing_feedback');
});

test('AI provider schema guard normalizes writing feedback', () => {
    const provider = new AIProviderService();

    const validated = provider.validateTaskOutput('writing_feedback', {
        score: '8.7',
        summary: 'Good work.',
        strengths: ['Clear idea'],
        corrections: [{ original: 'people is', corrected: 'people are', explanation: 'plural noun' }],
        rubric: { taskResponse: 9, coherence: '8', vocabulary: 20, grammar: -1 },
        rewriteSuggestion: 'People are happy.',
        nextActions: [{ type: 'unsafe', title: 'Bad link', path: 'https://example.com' }]
    }, { text: 'People is happy.' });

    assert.equal(validated.score, 8.7);
    assert.equal(validated.rubric.vocabulary, 10);
    assert.equal(validated.rubric.grammar, 0);
    assert.equal(validated.nextActions[0].path, '/chat');
});

test('provider health check records usage when user id is provided', async () => {
    const records = [];
    const usageService = new AIUsageService({
        dailyLimitPerUser: 5,
        repository: {
            async countByUserAndDate() {
                return 0;
            },
            async insert(record) {
                records.push(record);
                return { insertedId: 'usage-1' };
            }
        }
    });
    const provider = new AIProviderService({ aiUsageService: usageService });

    const result = await provider.testProvider('64b64c0f4f1a2562d08f9a10');

    assert.equal(result.ok, true);
    assert.equal(records.length, 1);
    assert.equal(records[0].task, 'provider_health_check');
});

test('AI provider debug snapshot exposes config usage fallback and latency', async () => {
    const debugService = new AIProviderDebugService({
        now: () => new Date('2026-07-27T00:00:00.000Z'),
        aiProviderService: {
            getStatus() {
                return {
                    provider: 'openai',
                    mode: 'live',
                    model: 'gpt-test',
                    isMock: false,
                    timeoutMs: 15000,
                    retryAttempts: 1
                };
            },
            getRegisteredProviders() {
                return ['openai', 'gemini', 'claude'];
            }
        },
        aiUsageService: {
            getDailyLimit() {
                return 5;
            },
            async getGlobalTodaySummary() {
                return {
                    date: '2026-07-27',
                    requests: 2,
                    totalTokens: 70,
                    estimatedCostUsd: 0.001,
                    uniqueUsers: 1
                };
            },
            async getRecentUsage() {
                return [
                    {
                        task: 'enhance_daily_plan',
                        totalTokens: 40,
                        estimatedCostUsd: 0.0007,
                        metadata: {
                            latencyMs: 1200,
                            hadFallback: true,
                            fallback: { code: 'AI_PROVIDER_TIMEOUT' }
                        }
                    },
                    {
                        task: 'agent_chat_reply',
                        totalTokens: 30,
                        estimatedCostUsd: 0.0003,
                        metadata: {
                            latencyMs: 600,
                            hadFallback: false
                        }
                    }
                ];
            }
        },
        aiTextToSpeechService: {
            getStatus() {
                return { provider: 'openai', mode: 'live' };
            }
        }
    });

    const snapshot = await debugService.getDebugSnapshot();

    assert.deepEqual(snapshot.registeredProviders, ['openai', 'gemini', 'claude']);
    assert.equal(snapshot.limits.dailyLimitPerUser, 5);
    assert.equal(snapshot.usageToday.requests, 2);
    assert.equal(snapshot.fallbackSummary.total, 1);
    assert.equal(snapshot.fallbackSummary.byCode.AI_PROVIDER_TIMEOUT, 1);
    assert.equal(snapshot.latencySummary.averageMs, 900);
    assert.equal(snapshot.taskSummary.enhance_daily_plan.requests, 1);
    assert.equal(snapshot.tts.provider, 'openai');
});

test('study guide agent builds time plan and memory guide steps', async () => {
    const agent = new StudyGuideAgent();
    const guide = await agent.buildCoachGuide('user-1', {
        targetMinutes: 30,
        dailyPlan: {
            learnerSnapshot: {
                experiencePoints: 120,
                maxStreak: 5,
                studyMinutesToday: 10
            },
            tasks: [
                {
                    type: 'flashcard',
                    title: 'Ôn 10 flashcard hôm nay',
                    estimatedMinutes: 10,
                    priority: 'high',
                    action: { label: 'Ôn ngay', path: '/flashcard' }
                }
            ]
        },
        memory: {
            proficiencyLevel: 'beginner',
            learningGoals: ['communication'],
            weakSkills: ['listening'],
            preferredTopics: ['travel'],
            coachTone: 'friendly',
            memoryVersion: 'learner-memory-v1',
            updatedAt: new Date('2026-07-10T00:00:00.000Z')
        }
    });

    assert.equal(guide.targetMinutes, 30);
    assert.equal(guide.recommendedFlow, 'daily_plan_first');
    assert.equal(guide.isNewLearner, false);
    assert.equal(guide.steps[0].type, 'time_setup');
    assert.ok(guide.steps.some(step => step.type === 'daily_plan_task'));
    assert.equal(guide.steps.at(-1).type, 'memory_profile');
    assert.equal(guide.recommendedFirstAction.path, '/flashcard');
});

test('study guide agent puts quick profile first for new learners', async () => {
    const agent = new StudyGuideAgent();
    const guide = await agent.buildCoachGuide('user-1', {
        targetMinutes: 10,
        dailyPlan: {
            learnerSnapshot: {
                experiencePoints: 0,
                maxStreak: 0,
                studyMinutesToday: 0,
                todayFlashcardReviews: 0
            },
            tasks: [
                {
                    type: 'chat',
                    title: 'Nói chuyện với AI hôm nay',
                    estimatedMinutes: 3,
                    priority: 'high',
                    action: { label: 'Bắt đầu chat', path: '/chat' }
                }
            ]
        },
        memory: {
            proficiencyLevel: 'beginner',
            learningGoals: ['daily_habit', 'communication'],
            weakSkills: [],
            preferredTopics: [],
            coachTone: 'friendly',
            memoryVersion: 'learner-memory-v1'
        }
    });

    assert.equal(guide.recommendedFlow, 'new_learner_onboarding');
    assert.equal(guide.isNewLearner, true);
    assert.equal(guide.shouldAskMemoryUpdate, false);
    assert.equal(guide.steps[0].type, 'new_learner_profile');
    assert.ok(guide.steps[0].fields.some(field => field.key === 'learningGoals'));
    assert.ok(guide.steps.some(step => step.type === 'time_setup'));
    assert.ok(guide.steps.some(step => step.type === 'daily_plan_task'));
    assert.ok(!guide.steps.some(step => step.type === 'memory_profile'));
});

test('agent chat session starts, receives message, finishes, and applies memory insights', async () => {
    const sessions = new Map();
    let memoryUpdate = null;
    const repository = {
        async insert(session) {
            const id = '64b64c0f4f1a2562d08f9a11';
            sessions.set(id, { ...session, _id: id });
            return id;
        },
        async findByIdForUser(sessionId) {
            return sessions.get(sessionId) || null;
        },
        async pushMessages(sessionId, messages) {
            const session = sessions.get(sessionId);
            session.messages.push(...messages);
            return { modifiedCount: 1 };
        },
        async completeSession(sessionId, data) {
            const session = sessions.get(sessionId);
            Object.assign(session, {
                status: 'completed',
                summary: data.summary,
                mistakes: data.mistakes,
                recommendedNextActions: data.recommendedNextActions
            });
            return { modifiedCount: 1 };
        }
    };
    const memoryService = {
        async getOrCreateMemory() {
            return {
                learningGoals: ['communication'],
                weakSkills: [],
                frequentMistakes: [],
                preferredTopics: ['travel'],
                coachTone: 'friendly'
            };
        },
        async applySessionInsights(userId, insights) {
            memoryUpdate = { userId, insights };
        }
    };
    const service = new AgentSessionService({
        repository,
        learnerMemoryService: memoryService,
        learningAgentService: {
            async getDailyPlan() {
                return { headline: 'Mock plan', tasks: [] };
            }
        },
        aiProviderService: new AIProviderService()
    });

    const started = await service.startChatSession('64b64c0f4f1a2562d08f9a10', { topic: 'travel' });
    const reply = await service.sendChatMessage('64b64c0f4f1a2562d08f9a10', started.sessionId, 'I am go to school');
    const finished = await service.finishChatSession('64b64c0f4f1a2562d08f9a10', started.sessionId);

    assert.ok(started.reply);
    assert.ok(reply.corrections.length > 0);
    assert.ok(finished.summary);
    assert.deepEqual(memoryUpdate.insights.weakSkills, ['grammar', 'speaking']);
});

test('agent mode service lists activity modes and ranks by learner memory', async () => {
    const service = new AgentModeService({
        repository: {
            async findAll(filter) {
                assert.equal(filter.activityType, 'chat');
                return [
                    {
                        key: 'free_chat',
                        activityType: 'chat',
                        title: 'Free Chat',
                        description: 'General practice',
                        skillFocus: ['speaking'],
                        sort: 20,
                        display: true
                    },
                    {
                        key: 'grammar_correction',
                        activityType: 'chat',
                        title: 'Grammar Correction',
                        description: 'Fix grammar',
                        skillFocus: ['grammar'],
                        sort: 30,
                        display: true
                    }
                ];
            }
        }
    });

    const modes = await service.listModes({
        activityType: 'chat',
        memory: { weakSkills: ['grammar'] }
    });

    assert.equal(modes.length, 2);
    assert.equal(modes[0].key, 'grammar_correction');
    assert.ok(modes[0].recommendedScore > modes[1].recommendedScore);
});

test('agent chat session stores selected mode config snapshot', async () => {
    let insertedSession = null;
    const service = new AgentSessionService({
        repository: {
            async insert(session) {
                insertedSession = session;
                return '64b64c0f4f1a2562d08f9a11';
            },
            async pushMessages() {
                return { modifiedCount: 1 };
            }
        },
        learnerMemoryService: {
            async getOrCreateMemory() {
                return { weakSkills: ['vocabulary'], preferredTopics: ['travel'] };
            }
        },
        learningAgentService: {
            async getDailyPlan() {
                return { headline: 'Plan', tasks: [] };
            }
        },
        agentModeService: {
            async getModeOrDefault() {
                return {
                    key: 'travel_roleplay',
                    activityType: 'chat',
                    title: 'Travel Roleplay',
                    skillFocus: ['speaking', 'vocabulary'],
                    promptHints: ['Stay in role.']
                };
            }
        },
        aiProviderService: new AIProviderService()
    });

    const started = await service.startChatSession('64b64c0f4f1a2562d08f9a10', {
        mode: 'travel_roleplay'
    });

    assert.equal(started.mode, 'travel_roleplay');
    assert.equal(started.modeConfig.title, 'Travel Roleplay');
    assert.equal(insertedSession.modeConfigSnapshot.key, 'travel_roleplay');
});

test('writing learning event extracts weak skills and updates memory', async () => {
    const insertedEvents = [];
    let memoryInsights = null;
    const service = new AgentLearningEventService({
        repository: {
            async insert(event) {
                insertedEvents.push(event);
                return { insertedId: 'event-1' };
            }
        },
        learnerMemoryService: {
            async applySessionInsights(userId, insights) {
                memoryInsights = { userId, insights };
            }
        }
    });

    const event = await service.recordWritingAnalysis('64b64c0f4f1a2562d08f9a10', {
        score: '6.5/10',
        feedback: 'Grammar and vocabulary need improvement. Coherence is not clear.',
        textLength: 240
    });

    assert.equal(insertedEvents.length, 1);
    assert.equal(event.source, 'writing');
    assert.ok(event.weakSkills.includes('writing'));
    assert.ok(event.weakSkills.includes('grammar'));
    assert.ok(event.weakSkills.includes('vocabulary'));
    assert.ok(memoryInsights.insights.mistakes.includes('grammar or sentence structure'));
});

test('learning events update memory from dictation pronunciation and flashcards', async () => {
    const insertedEvents = [];
    const memoryUpdates = [];
    const service = new AgentLearningEventService({
        repository: {
            async insert(event) {
                insertedEvents.push(event);
                return { insertedId: 'event-1' };
            }
        },
        learnerMemoryService: {
            async applySessionInsights(userId, insights) {
                memoryUpdates.push({ userId, insights });
            }
        }
    });

    await service.recordDictationCompletion('64b64c0f4f1a2562d08f9a10', {
        exerciseId: 'dictation-1',
        title: 'Airport listening'
    });
    await service.recordPronunciationAnalysis('64b64c0f4f1a2562d08f9a10', {
        exerciseId: 'pronunciation-1',
        questionIndex: 0,
        accuracy: 72,
        detailedResult: [
            { expected: 'worked', match: false },
            { expected: 'yesterday', match: true }
        ]
    });
    await service.recordFlashcardDifficultyUpdate('64b64c0f4f1a2562d08f9a10', {
        updates: [
            { cardId: 'card-1', difficulty: 1 },
            { cardId: 'card-2', difficulty: 3 }
        ]
    });

    assert.equal(insertedEvents.length, 3);
    assert.equal(insertedEvents[0].source, 'dictation');
    assert.ok(memoryUpdates[0].insights.weakSkills.includes('listening'));
    assert.ok(memoryUpdates[1].insights.weakSkills.includes('pronunciation'));
    assert.ok(memoryUpdates[1].insights.mistakes.includes('worked'));
    assert.ok(memoryUpdates[2].insights.weakSkills.includes('vocabulary'));
    assert.ok(memoryUpdates[2].insights.mistakes.includes('vocabulary recall'));
});

test('learner memory service creates default memory when missing', async () => {
    let inserted = null;
    const service = new LearnerMemoryService({
        repository: {
            async findByUserId() {
                return null;
            },
            async insert(memory) {
                inserted = memory;
                return { insertedId: 'memory-1' };
            }
        }
    });

    const memory = await service.getOrCreateMemory('64b64c0f4f1a2562d08f9a10');

    assert.equal(memory.proficiencyLevel, 'beginner');
    assert.deepEqual(memory.learningGoals, ['learning_journey', 'ai_chat']);
    assert.equal(inserted.user.toString(), '64b64c0f4f1a2562d08f9a10');
});

test('learner memory saved target stays selectable without raising profile minimum', () => {
    const service = new LearnerMemoryService({ repository: {} });
    const resolution = service.resolveTargetStudyMinutes({
        learningGoals: ['learning_journey', 'ai_chat', 'grammar_lesson'],
        weakSkills: ['listening', 'grammar'],
        frequentMistakes: [],
        studyPreferences: {
            targetStudyMinutes: 90
        }
    }, null);

    assert.equal(resolution.effectiveTargetMinutes, 90);
    assert.equal(resolution.minimumSelectableMinutes, 60);
    assert.deepEqual(resolution.allowedMinutes, [60, 90, 120]);
});

test('learner memory promotes weak skill only after repeated evidence', async () => {
    let storedMemory = {
        user: '64b64c0f4f1a2562d08f9a10',
        weakSkills: [],
        frequentMistakes: [],
        learningSignals: {}
    };
    const service = new LearnerMemoryService({
        repository: {
            async findByUserId() {
                return storedMemory;
            },
            async update(userId, update) {
                storedMemory = { ...storedMemory, ...update };
                return { modifiedCount: 1 };
            }
        }
    });

    await service.applySessionInsights('64b64c0f4f1a2562d08f9a10', {
        weakSkills: ['pronunciation'],
        mistakes: ['final sounds']
    }, {
        recentEvents: [
            { skill: 'pronunciation', weakSkills: ['pronunciation'], mistakes: ['final sounds'], createdAt: new Date() }
        ]
    });
    assert.deepEqual(storedMemory.weakSkills, []);

    await service.applySessionInsights('64b64c0f4f1a2562d08f9a10', {
        weakSkills: ['pronunciation'],
        mistakes: ['final sounds']
    }, {
        recentEvents: [
            { skill: 'pronunciation', weakSkills: ['pronunciation'], mistakes: ['final sounds'], createdAt: new Date() },
            { skill: 'pronunciation', weakSkills: ['pronunciation'], mistakes: ['final sounds'], createdAt: new Date() },
            { skill: 'pronunciation', weakSkills: ['pronunciation'], mistakes: ['final sounds'], createdAt: new Date() }
        ]
    });

    assert.ok(storedMemory.weakSkills.includes('pronunciation'));
    assert.ok(storedMemory.frequentMistakes.includes('final sounds'));
    assert.equal(storedMemory.learningSignals.skills.pronunciation.negativeCount7d, 3);
});

test('learner memory cools down weak skill after repeated good evidence', async () => {
    let storedMemory = {
        user: '64b64c0f4f1a2562d08f9a10',
        weakSkills: ['pronunciation'],
        frequentMistakes: [],
        learningSignals: {}
    };
    const service = new LearnerMemoryService({
        repository: {
            async findByUserId() {
                return storedMemory;
            },
            async update(userId, update) {
                storedMemory = { ...storedMemory, ...update };
                return { modifiedCount: 1 };
            }
        }
    });

    await service.applySessionInsights('64b64c0f4f1a2562d08f9a10', {}, {
        skill: 'pronunciation',
        score: 92,
        recentEvents: [
            { skill: 'pronunciation', score: 90, weakSkills: [], createdAt: new Date() },
            { skill: 'pronunciation', score: 88, weakSkills: [], createdAt: new Date() },
            { skill: 'pronunciation', score: 92, weakSkills: [], createdAt: new Date() }
        ]
    });

    assert.deepEqual(storedMemory.weakSkills, []);
    assert.equal(storedMemory.learningSignals.skills.pronunciation.positiveCount7d, 3);
});

test('learner memory update validates enum values', async () => {
    const service = new LearnerMemoryService({
        repository: {
            async findByUserId() {
                return { proficiencyLevel: 'beginner' };
            },
            async update() {
                return { modifiedCount: 1 };
            }
        }
    });

    await assert.rejects(
        () => service.updateMemory('64b64c0f4f1a2562d08f9a10', { weakSkills: ['invalid-skill'] }),
        /weakSkills contains invalid values/
    );
});
