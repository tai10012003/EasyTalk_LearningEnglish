const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require('dotenv');
const { errorHandler, notFound } = require('./src/shared/middleware/errorHandler');
const responseFormatter = require('./src/shared/middleware/responseFormatter');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'Reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

const app = express();
const server = http.createServer(app);

const { connectRedis } = require('../apps/src/shared/utils/redisClient');
async function initRedis() {
  try {
    await connectRedis(5000);
    console.log('Redis connected successfully');
  } catch (err) {
    console.error(`Redis init failed: ${err.message}`);
    console.error('Running without Redis cache - fallback to DB');
  }
}

const { initSocket } = require('../apps/src/shared/utils/socket');
initSocket(server);
console.log('Socket.IO initialized');

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173"
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(responseFormatter);

app.use("/static", express.static(__dirname + "/public"));

const UserRepository = require('../apps/src/modules/user/repositories/userRepository');
const UserProgressRepository = require('../apps/src/modules/userprogress/repositories/userprogressRepository');

const userRepository = new UserRepository();
const userProgressRepository = new UserProgressRepository();

const NotificationService = require('../apps/src/modules/notification/services/notificationService');
const UserSettingService = require('../apps/src/modules/usersetting/services/userSettingService');
const UserProgressService = require('../apps/src/modules/userprogress/services/userprogressService');
const StreakService = require('../apps/src/modules/userprogress/services/streakService');
const LeaderboardService = require('../apps/src/modules/userprogress/services/leaderboardService');
const FlashcardService = require('../apps/src/modules/flashcard/services/flashcardService');
const JourneyService = require('../apps/src/modules/journey/services/journeyService');
const GateService = require('../apps/src/modules/gate/services/gateService');
const StageService = require('../apps/src/modules/stage/services/stageService');

const notificationService = new NotificationService();
const userSettingService = new UserSettingService();
const userProgressService = new UserProgressService();
const streakService = new StreakService();
const leaderboardService = new LeaderboardService();
const flashcardService = new FlashcardService();
const journeyService = new JourneyService();
const gateService = new GateService();
const stageService = new StageService();

const userController = require('../apps/src/modules/user/controllers/userController');
const userProgressController = require('../apps/src/modules/userprogress/controllers/userprogressController');
const prizeController = require('../apps/src/modules/prize/controllers/prizeController');
const notificationController = require('../apps/src/modules/notification/controllers/notificationController');
const grammarController = require('../apps/src/modules/grammar/controllers/grammarController');
const pronunciationController = require('../apps/src/modules/pronunciation/controllers/pronunciationController');
const storyController = require('../apps/src/modules/story/controllers/storyController');
const grammarExerciseController = require('../apps/src/modules/grammarexercise/controllers/grammarexerciseController');
const pronunciationExerciseController = require('../apps/src/modules/pronunciationexercise/controllers/pronunciationExerciseController');
const vocabularyExerciseController = require('../apps/src/modules/vocabularyexercise/controllers/vocabularyexerciseController');
const dictationController = require('../apps/src/modules/dictationexercise/controllers/dictationexerciseController');
const journeyController = require('../apps/src/modules/journey/controllers/journeyController');
const gateController = require('../apps/src/modules/gate/controllers/gateController');
const stageController = require('../apps/src/modules/stage/controllers/stageController');
const flashcardController = require('../apps/src/modules/flashcard/controllers/flashcardController');
const reminderController = require('../apps/src/modules/reminder/controllers/reminderController');
const userSettingController = require('../apps/src/modules/usersetting/controllers/usersettingController');
const dashboardController = require('../apps/src/modules/dashboard/controllers/dashboardController');
const chatAIController = require('../apps/src/modules/chatai/controllers/chatAIController');
const writingAIController = require('../apps/src/modules/writingai/controllers/writingAIController');

// ==================== DEPENDENCY INJECTIONS ====================
// User module injections
userController.setNotificationService(notificationService);
userController.setUserSettingService(userSettingService);
userController.setUserProgressService(userProgressService);
userController.setFlashcardService(flashcardService);
// Journey module injections
journeyController.setGateService(gateService);
journeyController.setUserProgressService(userProgressService);
// Gate module injections
gateController.setJourneyService(journeyService);
gateController.setStageService(stageService);
// Stage module injections
stageController.setJourneyService(journeyService);
stageController.setGateService(gateService);
stageController.setUserProgressService(userProgressService);
// Reminder module injection
reminderController.setNotificationService(notificationService);
// Dashboard module injection
dashboardController.setRepositories(userRepository, userProgressRepository);
// UserProgress module injection
userProgressService.setStreakService(streakService);
userProgressService.setLeaderboardService(leaderboardService);

app.use("/user", userController);
app.use("/userprogress", userProgressController);
app.use("/prize", prizeController);
app.use("/notification", notificationController);
app.use("/grammar", grammarController);
app.use("/pronunciation", pronunciationController);
app.use("/grammar-exercise", grammarExerciseController);
app.use("/story", storyController);
app.use("/vocabulary-exercise", vocabularyExerciseController);
app.use("/pronunciation-exercise", pronunciationExerciseController);
app.use("/dictation-exercise", dictationController);
app.use("/journey", journeyController);
app.use("/gate", gateController);
app.use("/stage", stageController);
app.use("/flashcards", flashcardController);
app.use("/reminder", reminderController);
app.use("/setting", userSettingController);
app.use("/dashboard", dashboardController);
app.use("/chat", chatAIController);
app.use("/writing", writingAIController);

app.use(notFound);
app.use(errorHandler);

async function initBackgroundTasks() {
  try {
    const { reminderService } = reminderController;
    if (reminderService && reminderService.initReminders) {
      await reminderService.initReminders();
      console.log('Reminder cron jobs initialized');
    }
  } catch (error) {
    console.error('Failed to initialize reminder cron jobs:', error);
  }
}

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await initRedis();
    await initBackgroundTasks();
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
startServer();

module.exports = app;