var express = require("express");
var router = express.Router();
// user route
router.use("/journey", require(__dirname + "/journeycontroller"));
router.use("/gate", require(__dirname + "/gatecontroller"));
router.use("/stage", require(__dirname + "/stagecontroller"));
router.use("/grammar", require(__dirname + "/grammarcontroller"));
router.use("/pronunciation", require(__dirname + "/pronunciationcontroller"));
router.use("/story", require(__dirname + "/storycontroller"));
router.use("/grammar-exercise",  require(__dirname + "/grammarexercisecontroller"));
router.use("/pronunciation-exercise", require(__dirname + "/pronunciationexercisecontroller"));
router.use("/vocabulary-exercise", require(__dirname + "/vocabularyexercisecontroller"));
router.use("/blog", require(__dirname + "/blogcontroller"));
router.use("/login", require(__dirname + "/usercontroller"));
router.use("/auth/google", require(__dirname + "/usercontroller"));
router.use("/register", require(__dirname + "/usercontroller"));
router.use("/change-password", require(__dirname + "/usercontroller"));
router.use("/forgot-password", require(__dirname + "/usercontroller"));
router.use("/verify-code", require(__dirname + "/usercontroller"));
router.use("/reset-password", require(__dirname + "/usercontroller"));
router.use("/profile", require(__dirname + "/usercontroller")); 
router.use("/profile/update", require(__dirname + "/usercontroller"));
router.use("/flashcards",require(__dirname + "/flashcardcontroller"));
router.use("/chat", require(__dirname + "/chatcontroller"));
router.use("/communicate", require(__dirname + "/communicatecontroller"));
router.use("/writing", require(__dirname + "/writingcontroller"));
router.use("/reminder", require(__dirname + "/remindercontroller"));
router.use("/userprogress", require(__dirname + "/userprogresscontroller"));
router.use("/dictation-exercise", require(__dirname + "/dictationcontroller"))
router.use("/dictionary", require(__dirname + "/dictionarycontroller"));
// admin route
router.use("/admin/journey", require(__dirname + "/admin/journeyAdmincontroller"));
router.use("/admin/stage", require(__dirname + "/admin/stageAdmincontroller"));
router.use("/admin/story",require(__dirname + "/admin/storyAdmincontroller"));
router.use("/admin/grammar-exercise", require(__dirname + "/admin/grammarexerciseAdmincontroller"));
router.use("/admin/pronunciation",require(__dirname + "/admin/pronunciationAdmincontroller"));
router.use("/admin/pronunciation-exercise",require(__dirname + "/admin/pronunciationexerciseAdmincontroller"));
router.use("/admin/vocabulary-exercise",require(__dirname + "/admin/vocabularyexerciseAdmincontroller"));
router.use("/admin/user", require(__dirname + "/admin/userAdmincontroller"));

router.get("/single-blog", function (req, res) {
    res.render("single-blog.ejs");
});

router.get("/single-blog-1", function (req, res) {
    res.render("single-blog-1.ejs");
});
module.exports = router;
