const express = require("express");
const router = express.Router();
const PronunciationExercise = require("../../models/pronunciationexercise");

// Route để hiển thị danh sách bài tập phát âm
router.get("/", (req, res) => {
    PronunciationExercise.find()
        .then(pronunciationexercises => {
            res.render("pronunciationexercises/pronunciationexercise", { pronunciationexercises });
        })
        .catch(err => res.status(500).send("Error fetching pronunciation exercises."));
});

// Route để hiển thị trang thêm bài tập phát âm
router.get("/add", (req, res) => {
    res.render("pronunciationexercises/addpronunciationexercise");
});

// Route để thêm bài tập phát âm mới
router.post("/add", async (req, res) => {
    const { title, questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).send("Invalid questions format.");
    }

    // Validate and format questions
    const formattedQuestions = questions.map(question => ({
        question: question.question,
        type: question.type,
        audioUrl: question.audioUrl,
        correctAnswer: question.correctAnswer,
        options: question.options || [],
        explanation: question.explanation
    }));

    const newExercise = new PronunciationExercise({
        title,
        questions: formattedQuestions
    });

    try {
        await newExercise.save();
        res.redirect("/admin/pronunciation-exercise");
    } catch (err) {
        res.status(400).send("Error saving new pronunciation exercise: " + err.message);
    }
});

// Route để hiển thị trang cập nhật bài tập phát âm
router.get("/update/:id", (req, res) => {
    PronunciationExercise.findById(req.params.id)
        .then(exercise => {
            if (!exercise) {
                return res.status(404).send("Pronunciation exercise not found.");
            }
            res.render("pronunciationexercises/updatepronunciationexercise", { exercise });
        })
        .catch(err => res.status(404).send("Error fetching pronunciation exercise."));
});

// Route để cập nhật bài tập phát âm
router.post("/update/:id", async (req, res) => {
    const questions = req.body.questions || []; 

    const updateData = {
        title: req.body.title,
        questions
    };

    try {
        const exercise = await PronunciationExercise.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!exercise) {
            return res.status(404).send("Pronunciation exercise not found.");
        }
        res.redirect("/admin/pronunciation-exercise");
    } catch (err) {
        console.error(err); 
        res.status(400).send("Error updating pronunciation exercise.");
    }
});

// Route để xóa bài tập phát âm
router.post("/delete/:id", (req, res) => {
    PronunciationExercise.findByIdAndDelete(req.params.id)
        .then(exercise => {
            if (!exercise) {
                return res.status(404).send("Pronunciation exercise not found.");
            }
            res.redirect("/admin/pronunciation-exercise");
        })
        .catch(err => res.status(400).send("Error deleting pronunciation exercise."));
});

module.exports = router;
