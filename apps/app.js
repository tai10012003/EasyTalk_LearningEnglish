const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require('dotenv');
const path = require("path");
const { errorHandler, notFound } = require('./src/shared/middleware/errorHandler');
const responseFormatter = require('./src/shared/middleware/responseFormatter');

const runtimeEnv = process.env.APP_ENV || process.env.NODE_ENV;
const envFile = process.env.ENV_FILE || (runtimeEnv === 'production' ? '.env.production' : '.env.development');
dotenv.config({ path: path.resolve(__dirname, envFile) });
const { validateEnv } = require('./src/shared/config/envValidator');
validateEnv();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'Reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

const app = express();
const server = http.createServer(app);

function getAllowedClientOrigins() {
  return (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean)
    .map(origin => {
      try {
        return new URL(origin).origin;
      } catch {
        return origin;
      }
    });
}

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
const io = initSocket(server, getAllowedClientOrigins());
console.log('Socket.IO initialized');

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    if (getAllowedClientOrigins().includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(responseFormatter);

app.use("/static", express.static(__dirname + "/public"));

const { buildDependencies } = require('./src/bootstrap/dependencies');
const { controllers } = buildDependencies({ io });

app.use("/user", controllers.userController);
app.use("/userprogress", controllers.userProgressController);
app.use("/prize", controllers.prizeController);
app.use("/notification", controllers.notificationController);
app.use("/grammar", controllers.grammarController);
app.use("/pronunciation", controllers.pronunciationController);
app.use("/grammar-exercise", controllers.grammarExerciseController);
app.use("/story", controllers.storyController);
app.use("/vocabulary-exercise", controllers.vocabularyExerciseController);
app.use("/pronunciation-exercise", controllers.pronunciationExerciseController);
app.use("/dictation-exercise", controllers.dictationController);
app.use("/journey", controllers.journeyController);
app.use("/gate", controllers.gateController);
app.use("/stage", controllers.stageController);
app.use("/flashcards", controllers.flashcardController);
app.use("/reminder", controllers.reminderController);
app.use("/setting", controllers.userSettingController);
app.use("/dashboard", controllers.dashboardController);
app.use("/chat", controllers.chatAIController);
app.use("/writing", controllers.writingAIController);

app.use(notFound);
app.use(errorHandler);

async function initBackgroundTasks() {
  try {
    const { reminderService } = controllers.reminderController;
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