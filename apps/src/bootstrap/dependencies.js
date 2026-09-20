const { createUserController, UserService, AuthenticationService, EmailService, SocialAuthService, SecurityAuditService, UserRepository, UserSessionRepository } = require('../modules/user');
const { createUserProgressController, UserProgressService, StreakService, LeaderboardService, BadgeService, UserPrizeService, FollowService, UserProgressRepository } = require('../modules/userprogress');
const { createGrammarController, GrammarService, GrammarImageService, GrammarRepository } = require('../modules/grammar');
const { createPronunciationController, PronunciationService, PronunciationImageService, PronunciationRepository } = require('../modules/pronunciation');
const { createStoryController, StoryService, StoryImageService, StoryRepository } = require('../modules/story');
const { createGrammarExerciseController, GrammarExerciseService, GrammarExerciseRepository, GrammarExerciseAttemptRepository } = require('../modules/grammarexercise');
const { createPronunciationExerciseController, PronunciationExerciseService, SpeechAnalysisService, PronunciationExerciseRepository, PronunciationExerciseAttemptRepository } = require('../modules/pronunciationexercise');
const { createVocabularyExerciseController, VocabularyExerciseService, VocabularyExerciseRepository, VocabularyExerciseAttemptRepository } = require('../modules/vocabularyexercise');
const { createDictationExerciseController, DictationExerciseService, DictationExerciseRepository } = require('../modules/dictationexercise');
const { createJourneyController, JourneyService } = require('../modules/journey');
const { createGateController, GateService } = require('../modules/gate');
const { createStageController, StageService } = require('../modules/stage');
const { createFlashcardController, FlashcardService, FlashcardImageService } = require('../modules/flashcard');
const { createReminderController, ReminderService, ReminderSchedulerService, ReminderEmailService } = require('../modules/reminder');
const { createDashboardController, DashboardService, ActivityAnalyticsService, ContentAnalyticsService, LeaderboardAnalyticsService, SecurityDashboardService, AgentDebugDashboardService } = require('../modules/dashboard');
const { createLearningAgentController, LearningAgentService, LearnerMemoryService, AIProviderService, AIUsageService, AITextToSpeechService, AIProviderDebugService, DailyPlanCacheService, PromptTemplateService, MockAIResponseService, AgentSessionService, AgentLearningEventService, AgentModeService, AIResponseSchemaGuard, ProviderFactory, AICostReporter, AILatencyReporter, FallbackReporter, AITraceService, DailyPlanAgent, ChatCoachAgent, WritingCoachAgent, StudyGuideAgent, AgentRegistry, ProgressTool, MemoryTool, DailyPlanTool, LearningEventTool } = require('../modules/learningAgent');
const { createWritingAIController, WritingAIService, TopicGeneratorService, WritingAnalyzerService } = require('../modules/writingAI');
const { createChatAIController, ChatAIService, OpenAIService, ConversationFlowService } = require('../modules/chatAI');
const { createPrizeController, PrizeService } = require('../modules/prize');
const { createNotificationController, NotificationService } = require('../modules/notification');
const { createUserSettingController, UserSettingService } = require('../modules/usersetting');
const { createEnglishTranslationController, EnglishTranslationService } = require('../modules/englishtranslation');
const { ContentProgressService } = require('../modules/learningContent');
const { createCacheController } = require('../modules/cache');
const cacheService = require('../shared/utils/cacheService');

function buildDependencies(options = {}) {
    const repositories = {
        userRepository: new UserRepository(),
        userProgressRepository: new UserProgressRepository(),
        grammarRepository: new GrammarRepository(),
        pronunciationRepository: new PronunciationRepository(),
        storyRepository: new StoryRepository(),
        grammarExerciseRepository: new GrammarExerciseRepository(),
        grammarExerciseAttemptRepository: new GrammarExerciseAttemptRepository(),
        pronunciationExerciseRepository: new PronunciationExerciseRepository(),
        pronunciationExerciseAttemptRepository: new PronunciationExerciseAttemptRepository(),
        vocabularyExerciseRepository: new VocabularyExerciseRepository(),
        vocabularyExerciseAttemptRepository: new VocabularyExerciseAttemptRepository(),
        dictationExerciseRepository: new DictationExerciseRepository(),
        userSessionRepository: new UserSessionRepository()
    };
    const services = {
        securityAuditService: new SecurityAuditService(),
        emailService: new EmailService(),
        socialAuthService: new SocialAuthService(),
        notificationService: new NotificationService({ io: options.io }),
        userSettingService: new UserSettingService(),
        userProgressService: new UserProgressService(),
        leaderboardService: new LeaderboardService(),
        badgeService: new BadgeService(),
        prizeService: new PrizeService(),
        followService: new FollowService(),
        englishTranslationService: new EnglishTranslationService(),
        flashcardImageService: new FlashcardImageService(),
        grammarImageService: new GrammarImageService("easytalk/grammar"),
        pronunciationImageService: new PronunciationImageService("easytalk/pronunciation"),
        storyImageService: new StoryImageService("easytalk/story"),
        speechAnalysisService: new SpeechAnalysisService(),
        reminderSchedulerService: new ReminderSchedulerService(),
        reminderEmailService: new ReminderEmailService(),
        chatOpenAIService: new OpenAIService(),
        topicGeneratorService: new TopicGeneratorService(),
        writingAnalyzerService: new WritingAnalyzerService(),
        promptTemplateService: new PromptTemplateService(),
        aiResponseValidatorService: new AIResponseSchemaGuard(),
        mockAIResponseService: new MockAIResponseService(),
        aiCostReporter: new AICostReporter(),
        aiLatencyReporter: new AILatencyReporter(),
        fallbackReporter: new FallbackReporter(),
        aiTraceService: new AITraceService(),
        cacheService
    };
    services.authService = new AuthenticationService({
        sessionRepository: repositories.userSessionRepository,
        securityAuditService: services.securityAuditService
    });
    services.flashcardService = new FlashcardService({
        imageService: services.flashcardImageService,
        userProgressService: services.userProgressService
    });
    services.reminderService = new ReminderService({
        schedulerService: services.reminderSchedulerService,
        emailService: services.reminderEmailService,
        notificationService: services.notificationService
    });
    services.conversationFlowService = new ConversationFlowService(services.chatOpenAIService);
    services.chatAIService = new ChatAIService({
        openAIService: services.chatOpenAIService,
        conversationFlowService: services.conversationFlowService
    });
    services.streakService = new StreakService({
        notificationService: services.notificationService
    });
    services.userPrizeService = new UserPrizeService({
        notificationService: services.notificationService,
        prizeService: services.prizeService
    });
    services.activityAnalyticsService = new ActivityAnalyticsService(repositories.userRepository);
    services.contentAnalyticsService = new ContentAnalyticsService(repositories.userRepository.db);
    services.leaderboardAnalyticsService = new LeaderboardAnalyticsService(repositories.userProgressRepository);
    services.securityDashboardService = new SecurityDashboardService(repositories.userRepository.db);
    services.agentDebugDashboardService = new AgentDebugDashboardService(repositories.userRepository.db);
    services.dashboardService = new DashboardService(
        repositories.userRepository,
        repositories.userProgressRepository,
        {
            activityService: services.activityAnalyticsService,
            contentService: services.contentAnalyticsService,
            leaderboardService: services.leaderboardAnalyticsService,
            securityService: services.securityDashboardService,
            agentDebugService: services.agentDebugDashboardService
        }
    );
    services.userService = new UserService({
        repository: repositories.userRepository,
        authService: services.authService,
        emailService: services.emailService,
        socialAuthService: services.socialAuthService,
        securityAuditService: services.securityAuditService,
        notificationService: services.notificationService,
        userSettingService: services.userSettingService,
        userProgressService: services.userProgressService,
        flashcardService: services.flashcardService
    });
    const learningServiceDeps = {
        cacheService,
        userProgressService: services.userProgressService
    };
    services.grammarService = new GrammarService({
        ...learningServiceDeps,
        repository: repositories.grammarRepository,
        imageService: services.grammarImageService,
        englishTranslationService: services.englishTranslationService
    });
    services.pronunciationService = new PronunciationService({
        ...learningServiceDeps,
        repository: repositories.pronunciationRepository,
        imageService: services.pronunciationImageService,
        englishTranslationService: services.englishTranslationService
    });
    services.storyService = new StoryService({
        ...learningServiceDeps,
        repository: repositories.storyRepository,
        imageService: services.storyImageService,
        englishTranslationService: services.englishTranslationService
    });
    services.grammarExerciseService = new GrammarExerciseService({
        ...learningServiceDeps,
        repository: repositories.grammarExerciseRepository,
        attemptRepository: repositories.grammarExerciseAttemptRepository,
        englishTranslationService: services.englishTranslationService
    });
    services.pronunciationExerciseService = new PronunciationExerciseService({
        ...learningServiceDeps,
        repository: repositories.pronunciationExerciseRepository,
        attemptRepository: repositories.pronunciationExerciseAttemptRepository,
        speechAnalysisService: services.speechAnalysisService,
        englishTranslationService: services.englishTranslationService
    });
    services.vocabularyExerciseService = new VocabularyExerciseService({
        ...learningServiceDeps,
        repository: repositories.vocabularyExerciseRepository,
        attemptRepository: repositories.vocabularyExerciseAttemptRepository,
        englishTranslationService: services.englishTranslationService
    });
    services.dictationExerciseService = new DictationExerciseService({
        ...learningServiceDeps,
        repository: repositories.dictationExerciseRepository,
        englishTranslationService: services.englishTranslationService
    });
    services.journeyService = new JourneyService({
        cacheService,
        englishTranslationService: services.englishTranslationService
    });
    services.gateService = new GateService({
        cacheService,
        journeyService: services.journeyService,
        englishTranslationService: services.englishTranslationService
    });
    services.stageService = new StageService({
        cacheService,
        gateService: services.gateService,
        journeyService: services.journeyService,
        userProgressService: services.userProgressService,
        englishTranslationService: services.englishTranslationService
    });
    services.gateService.setStageService(services.stageService);
    services.learnerMemoryService = new LearnerMemoryService();
    services.aiUsageService = new AIUsageService();
    services.dailyPlanCacheService = new DailyPlanCacheService({
        cacheService
    });
    services.aiProviderService = new AIProviderService({
        aiUsageService: services.aiUsageService,
        promptTemplateService: services.promptTemplateService,
        aiResponseValidatorService: services.aiResponseValidatorService,
        mockAIResponseService: services.mockAIResponseService,
        providerRegistry: ProviderFactory.createRegistry(),
        aiCostReporter: services.aiCostReporter,
        aiLatencyReporter: services.aiLatencyReporter,
        fallbackReporter: services.fallbackReporter,
        aiTraceService: services.aiTraceService
    });
    services.aiTextToSpeechService = new AITextToSpeechService({
        aiUsageService: services.aiUsageService
    });
    services.aiProviderDebugService = new AIProviderDebugService({
        aiProviderService: services.aiProviderService,
        aiUsageService: services.aiUsageService,
        aiTextToSpeechService: services.aiTextToSpeechService,
        dailyPlanCacheService: services.dailyPlanCacheService
    });
    services.progressTool = new ProgressTool({
        userProgressService: services.userProgressService
    });
    services.memoryTool = new MemoryTool({
        learnerMemoryService: services.learnerMemoryService
    });
    services.dailyPlanAgent = new DailyPlanAgent();
    services.learningAgentService = new LearningAgentService({
        progressTool: services.progressTool,
        memoryTool: services.memoryTool,
        dailyPlanAgent: services.dailyPlanAgent,
        aiProviderService: services.aiProviderService,
        dailyPlanCacheService: services.dailyPlanCacheService
    });
    services.dailyPlanTool = new DailyPlanTool({
        learningAgentService: services.learningAgentService
    });
    services.learningEventTool = new LearningEventTool();
    services.chatCoachAgent = new ChatCoachAgent({
        memoryTool: services.memoryTool,
        dailyPlanTool: services.dailyPlanTool,
        aiProviderService: services.aiProviderService
    });
    services.studyGuideAgent = new StudyGuideAgent({
        dailyPlanTool: services.dailyPlanTool,
        memoryTool: services.memoryTool
    });
    services.agentSessionService = new AgentSessionService({
        chatCoachAgent: services.chatCoachAgent,
        aiProviderService: services.aiProviderService
    });
    services.agentLearningEventService = new AgentLearningEventService({
        learnerMemoryService: services.learnerMemoryService
    });
    services.learningEventTool.setAgentLearningEventService(services.agentLearningEventService);
    services.agentModeService = new AgentModeService({ englishTranslationService: services.englishTranslationService });
    services.agentSessionService.setAgentModeService(services.agentModeService);
    services.flashcardService.setAgentLearningEventService(services.agentLearningEventService);
    services.pronunciationExerciseService.setAgentLearningEventService(services.agentLearningEventService);
    services.dictationExerciseService.setAgentLearningEventService(services.agentLearningEventService);
    services.writingCoachAgent = new WritingCoachAgent({
        writingAnalyzer: services.writingAnalyzerService,
        learningEventTool: services.learningEventTool,
        agentModeService: services.agentModeService,
        aiProviderService: services.aiProviderService
    });
    services.agentRegistry = new AgentRegistry({
        dailyPlan: services.dailyPlanAgent,
        chatCoach: services.chatCoachAgent,
        writingCoach: services.writingCoachAgent,
        studyGuide: services.studyGuideAgent
    });
    services.writingAIService = new WritingAIService({
        topicGenerator: services.topicGeneratorService,
        writingAnalyzer: services.writingAnalyzerService,
        writingCoachAgent: services.agentRegistry.require('writingCoach')
    });
    services.userProgressService.setStreakService(services.streakService);
    services.userProgressService.setLeaderboardService(services.leaderboardService);
    services.userProgressService.setBadgeService(services.badgeService);
    services.userProgressService.setUserPrizeService(services.userPrizeService);
    services.userProgressService.setFollowService(services.followService);
    services.badgeService.setUserPrizeService(services.userPrizeService);
    services.userPrizeService.setUserProgressService(services.userProgressService);
    services.contentProgressService = new ContentProgressService({
        grammarService: services.grammarService,
        pronunciationService: services.pronunciationService,
        storyService: services.storyService,
        grammarExerciseService: services.grammarExerciseService,
        pronunciationExerciseService: services.pronunciationExerciseService,
        vocabularyExerciseService: services.vocabularyExerciseService,
        dictationExerciseService: services.dictationExerciseService
    });
    services.userProgressService.setContentProgressService(services.contentProgressService);
    const userController = createUserController({
        userService: services.userService,
        notificationService: services.notificationService,
        userSettingService: services.userSettingService,
        userProgressService: services.userProgressService,
        flashcardService: services.flashcardService
    });
    const userProgressController = createUserProgressController({
        userProgressService: services.userProgressService,
        badgeService: services.badgeService,
        userPrizeService: services.userPrizeService,
        leaderboardService: services.leaderboardService,
        followService: services.followService
    });
    const learningAgentController = createLearningAgentController({
        learningAgentService: services.learningAgentService,
        learnerMemoryService: services.learnerMemoryService,
        aiProviderService: services.aiProviderService,
        aiUsageService: services.aiUsageService,
        aiTextToSpeechService: services.aiTextToSpeechService,
        aiProviderDebugService: services.aiProviderDebugService,
        studyGuideAgent: services.agentRegistry.require('studyGuide'),
        agentSessionService: services.agentSessionService,
        agentLearningEventService: services.agentLearningEventService,
        agentModeService: services.agentModeService
    });
    const prizeController = createPrizeController({
        prizeService: services.prizeService,
        userPrizeService: services.userPrizeService,
        englishTranslationService: services.englishTranslationService
    });
    const notificationController = createNotificationController({
        notificationService: services.notificationService
    });
    const userSettingController = createUserSettingController({
        userSettingService: services.userSettingService
    });
    const dashboardController = createDashboardController({
        dashboardService: services.dashboardService
    });
    const chatAIController = createChatAIController({
        chatAIService: services.chatAIService
    });
    const writingAIController = createWritingAIController({
        writingAIService: services.writingAIService
    });
    const cacheController = createCacheController({
        services
    });
    const englishTranslationController = createEnglishTranslationController({
        englishTranslationService: services.englishTranslationService
    });
    const grammarExerciseController = createGrammarExerciseController({
        grammarExerciseService: services.grammarExerciseService
    });
    const pronunciationExerciseController = createPronunciationExerciseController({
        pronunciationExerciseService: services.pronunciationExerciseService
    });
    const vocabularyExerciseController = createVocabularyExerciseController({
        vocabularyExerciseService: services.vocabularyExerciseService
    });
    const dictationController = createDictationExerciseController({
        dictationExerciseService: services.dictationExerciseService
    });
    const journeyController = createJourneyController({
        journeyService: services.journeyService,
        gateService: services.gateService,
        userProgressService: services.userProgressService
    });
    const gateController = createGateController({
        gateService: services.gateService
    });
    const stageController = createStageController({
        stageService: services.stageService
    });
    const flashcardController = createFlashcardController({
        flashcardService: services.flashcardService,
        userProgressService: services.userProgressService
    });
    const reminderController = createReminderController({
        reminderService: services.reminderService,
        notificationService: services.notificationService
    });
    const grammarController = createGrammarController({
        grammarService: services.grammarService
    });
    const pronunciationController = createPronunciationController({
        pronunciationService: services.pronunciationService
    });
    const storyController = createStoryController({
        storyService: services.storyService
    });
    const controllers = {
        userController,
        userProgressController,
        prizeController,
        notificationController,
        grammarController,
        pronunciationController,
        grammarExerciseController,
        storyController,
        vocabularyExerciseController,
        pronunciationExerciseController,
        dictationController,
        journeyController,
        gateController,
        stageController,
        flashcardController,
        reminderController,
        userSettingController,
        dashboardController,
        chatAIController,
        writingAIController,
        learningAgentController,
        cacheController,
        englishTranslationController
    };
    return {
        controllers,
        services,
        repositories
    };
}

module.exports = { buildDependencies };
