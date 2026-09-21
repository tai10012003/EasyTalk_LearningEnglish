const { errorHandler, notFound } = require('../shared/middleware/errorHandler');

function registerRoutes(app, controllers, options = {}) {
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
    app.use("/agent", controllers.learningAgentController);
    app.use("/cache", controllers.cacheController);
    app.use("/english-translations", controllers.englishTranslationController);
    if (options.AWSXRay) {
        app.use(options.AWSXRay.express.closeSegment());
    }
    app.use(notFound);
    app.use(errorHandler);
}

module.exports = { registerRoutes };