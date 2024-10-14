const express = require("express");
const router = express.Router();
const GrammarExercise = require("../../models/grammarexercise");

// Route để hiển thị danh sách bài tập ngữ pháp
router.get("/", (req, res) => {
    GrammarExercise.find()
        .then(grammarexercises => {
            res.render("grammarexercises/grammarexercise", { grammarexercises });
        })
        .catch(err => res.status(500).send("Error fetching grammar exercises."));
});

// Route để hiển thị trang thêm bài tập ngữ pháp
router.get("/add", (req, res) => {
    res.render("grammarexercises/addgrammarexercise");
});

// Route to add a new grammar exercise
router.post("/add", async (req, res) => {
    const { title, questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).send("Invalid questions format.");
    }

    // Validate questions
    const formattedQuestions = questions.map(question => ({
        question: question.question,
        type: question.type,
        options: question.options || [],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation
    }));

    const newExercise = new GrammarExercise({
        title,
        questions: formattedQuestions
    });

    try {
        await newExercise.save();
        res.redirect("/admin/grammar-exercise");
    } catch (err) {
        res.status(400).send("Error saving new grammar exercise: " + err.message);
    }
});


// Route để hiển thị trang cập nhật bài tập ngữ pháp
router.get("/update/:id", (req, res) => {
    GrammarExercise.findById(req.params.id)
        .then(exercise => {
            if (!exercise) {
                return res.status(404).send("Grammar exercise not found.");
            }
            res.render("grammarexercises/updategrammarexercise", { exercise });
        })
        .catch(err => res.status(404).send("Error fetching grammar exercise."));
});

// Route to update a grammar exercise
router.post("/update/:id", async (req, res) => {
    const questions = req.body.questions || []; // Không cần phân tích cú pháp

    const updateData = {
        title: req.body.title,
        questions
    };

    try {
        const exercise = await GrammarExercise.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!exercise) {
            return res.status(404).send("Grammar exercise not found.");
        }
        res.redirect("/admin/grammar-exercise");
    } catch (err) {
        console.error(err); // In lỗi ra console để dễ dàng theo dõi
        res.status(400).send("Error updating grammar exercise.");
    }
});


// Route để xóa bài tập ngữ pháp
router.post("/delete/:id", (req, res) => {
    GrammarExercise.findByIdAndDelete(req.params.id)
        .then(exercise => {
            if (!exercise) {
                return res.status(404).send("Grammar exercise not found.");
            }
            res.redirect("/admin/grammar-exercise");
        })
        .catch(err => res.status(400).send("Error deleting grammar exercise."));
});

module.exports = router;
