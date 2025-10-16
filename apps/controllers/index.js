var express = require("express");
var router = express.Router();

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
router.use("/user", require(__dirname + "/usercontroller"));
router.use("/flashcards",require(__dirname + "/flashcardcontroller"));
router.use("/chat", require(__dirname + "/chatcontroller"));
router.use("/communicate", require(__dirname + "/communicatecontroller"));
router.use("/writing", require(__dirname + "/writingcontroller"));
router.use("/reminder", require(__dirname + "/remindercontroller"));
router.use("/userprogress", require(__dirname + "/userprogresscontroller"));
router.use("/dictation-exercise", require(__dirname + "/dictationcontroller"))
router.use("/dictionary", require(__dirname + "/dictionarycontroller"));

router.get("/single-blog", function (req, res) {
    res.render("single-blog.ejs");
});

router.get("/single-blog-1", function (req, res) {
    res.render("single-blog-1.ejs");
});
module.exports = router;
