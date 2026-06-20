const UserRepository = require('../modules/user/repositories/userRepository');
const UserProgressRepository = require('../modules/userprogress/repositories/userprogressRepository');

const NotificationService = require('../modules/notification/services/notificationService');
const UserSettingService = require('../modules/usersetting/services/userSettingService');
const UserProgressService = require('../modules/userprogress/services/userprogressService');
const StreakService = require('../modules/userprogress/services/streakService');
const LeaderboardService = require('../modules/userprogress/services/leaderboardService');
const BadgeService = require('../modules/userprogress/services/badgeService');
const UserPrizeService = require('../modules/userprogress/services/userprizeService');
const FollowService = require('../modules/userprogress/services/followService');
const PrizeService = require('../modules/prize/services/prizeService');
const FlashcardService = require('../modules/flashcard/services/flashcardService');
const GrammarService = require('../modules/grammar/services/grammarService');
const PronunciationService = require('../modules/pronunciation/services/pronunciationService');
const StoryService = require('../modules/story/services/storyService');
const GrammarExerciseService = require('../modules/grammarexercise/services/grammarexerciseService');
const PronunciationExerciseService = require('../modules/pronunciationexercise/services/pronunciationexerciseService');
const VocabularyExerciseService = require('../modules/vocabularyexercise/services/vocabularyexerciseService');
const DictationExerciseService = require('../modules/dictationexercise/services/dictationexerciseService');
const JourneyService = require('../modules/journey/services/journeyService');
const GateService = require('../modules/gate/services/gateService');
const StageService = require('../modules/stage/services/stageService');
const cacheService = require('../shared/utils/cacheService');

const userController = require('../modules/user/controllers/userController');
const userProgressController = require('../modules/userprogress/controllers/userprogressController');
const prizeController = require('../modules/prize/controllers/prizeController');
const notificationController = require('../modules/notification/controllers/notificationController');
const grammarController = require('../modules/grammar/controllers/grammarController');
const pronunciationController = require('../modules/pronunciation/controllers/pronunciationController');
const storyController = require('../modules/story/controllers/storyController');
const grammarExerciseController = require('../modules/grammarexercise/controllers/grammarexerciseController');
const pronunciationExerciseController = require('../modules/pronunciationexercise/controllers/pronunciationExerciseController');
const vocabularyExerciseController = require('../modules/vocabularyexercise/controllers/vocabularyexerciseController');
const dictationController = require('../modules/dictationexercise/controllers/dictationexerciseController');
const journeyController = require('../modules/journey/controllers/journeyController');
const gateController = require('../modules/gate/controllers/gateController');
const stageController = require('../modules/stage/controllers/stageController');
const flashcardController = require('../modules/flashcard/controllers/flashcardController');
const reminderController = require('../modules/reminder/controllers/reminderController');
const userSettingController = require('../modules/usersetting/controllers/usersettingController');
const dashboardController = require('../modules/dashboard/controllers/dashboardController');
const chatAIController = require('../modules/chatai/controllers/chatAIController');
const writingAIController = require('../modules/writingai/controllers/writingAIController');

function buildDependencies(options = {}) {
    const repositories = {
        userRepository: new UserRepository(),
        userProgressRepository: new UserProgressRepository()
    };

    const services = {
        notificationService: new NotificationService({ io: options.io }),
        userSettingService: new UserSettingService(),
        userProgressService: new UserProgressService(),
        streakService: new StreakService(),
        leaderboardService: new LeaderboardService(),
        badgeService: new BadgeService(),
        prizeService: new PrizeService(),
        followService: new FollowService(),
        flashcardService: new FlashcardService(),
        cacheService
    };

    services.userPrizeService = new UserPrizeService({
        notificationService: services.notificationService,
        prizeService: services.prizeService
    });

    const learningServiceDeps = {
        cacheService,
        userProgressService: services.userProgressService
    };

    services.grammarService = new GrammarService(learningServiceDeps);
    services.pronunciationService = new PronunciationService(learningServiceDeps);
    services.storyService = new StoryService(learningServiceDeps);
    services.grammarExerciseService = new GrammarExerciseService(learningServiceDeps);
    services.pronunciationExerciseService = new PronunciationExerciseService(learningServiceDeps);
    services.vocabularyExerciseService = new VocabularyExerciseService(learningServiceDeps);
    services.dictationExerciseService = new DictationExerciseService(learningServiceDeps);
    services.journeyService = new JourneyService({ cacheService });
    services.gateService = new GateService({ cacheService });
    services.stageService = new StageService({ cacheService });

    userController.setNotificationService(services.notificationService);
    userController.setUserSettingService(services.userSettingService);
    userController.setUserProgressService(services.userProgressService);
    userController.setFlashcardService(services.flashcardService);

    notificationController.setNotificationService(services.notificationService);
    userSettingController.setUserSettingService(services.userSettingService);
    flashcardController.setFlashcardService(services.flashcardService);
    flashcardController.setUserProgressService(services.userProgressService);
    prizeController.setPrizeService(services.prizeService);
    prizeController.setUserPrizeService(services.userPrizeService);

    journeyController.setGateService(services.gateService);
    journeyController.setUserProgressService(services.userProgressService);
    gateController.setJourneyService(services.journeyService);
    gateController.setStageService(services.stageService);
    stageController.setJourneyService(services.journeyService);
    stageController.setGateService(services.gateService);
    stageController.setUserProgressService(services.userProgressService);
    reminderController.setNotificationService(services.notificationService);
    dashboardController.setRepositories(repositories.userRepository, repositories.userProgressRepository);

    services.userProgressService.setStreakService(services.streakService);
    services.userProgressService.setLeaderboardService(services.leaderboardService);
    services.userProgressService.setBadgeService(services.badgeService);
    services.userProgressService.setUserPrizeService(services.userPrizeService);
    services.userProgressService.setFollowService(services.followService);
    services.badgeService.setUserPrizeService(services.userPrizeService);
    services.userPrizeService.setUserProgressService(services.userProgressService);
    services.userProgressService.setContentServices({
        grammarService: services.grammarService,
        pronunciationService: services.pronunciationService,
        storyService: services.storyService,
        grammarexerciseService: services.grammarExerciseService,
        pronunciationexerciseService: services.pronunciationExerciseService,
        vocabularyexerciseService: services.vocabularyExerciseService,
        dictationexerciseService: services.dictationExerciseService
    });

    grammarController.setGrammarService(services.grammarService);
    pronunciationController.setPronunciationService(services.pronunciationService);
    storyController.setStoryService(services.storyService);
    grammarExerciseController.setGrammarExerciseService(services.grammarExerciseService);
    pronunciationExerciseController.setPronunciationExerciseService(services.pronunciationExerciseService);
    vocabularyExerciseController.setVocabularyExerciseService(services.vocabularyExerciseService);
    dictationController.setDictationExerciseService(services.dictationExerciseService);
    journeyController.setJourneyServiceInstance(services.journeyService);
    gateController.setGateServiceInstance(services.gateService);
    stageController.setStageServiceInstance(services.stageService);
    userProgressController.setUserProgressService(services.userProgressService);
    userProgressController.setBadgeService(services.badgeService);
    userProgressController.setStreakService(services.streakService);
    userProgressController.setUserPrizeService(services.userPrizeService);
    userProgressController.setLeaderboardService(services.leaderboardService);
    userProgressController.setFollowService(services.followService);

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
        writingAIController
    };

    return {
        controllers,
        services,
        repositories
    };
}

module.exports = { buildDependencies };