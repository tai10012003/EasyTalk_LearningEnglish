const express = require("express");
const router = express.Router();
const multer = require('multer');
const axios = require('axios'); 
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const FormData = require('form-data');
const verifyToken = require("./../util/VerifyToken");
const { PronunciationexerciseService } = require("../services");
const pronunciationexerciseService = new PronunciationexerciseService();

router.get("/api/pronunciation-exercises", verifyToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const role = req.user.role || "user";
        const { pronunciationexercises, totalExercises } = await pronunciationexerciseService.getPronunciationexerciseList(page, limit, role);
        const totalPages = Math.ceil(totalExercises / limit);
        res.json({
          success: true,
          data: pronunciationexercises,
          currentPage: page,
          totalPages,
        });
    } catch (error) {
        console.error("Error fetching pronunciation exercises:", error);
        res.status(500).json({ success: false, message: "Error fetching pronunciation exercises", error: error.message });
    }
});

router.get("/api/pronunciation-exercises/:id", async function (req, res) {
    try {
        const exercise = await pronunciationexerciseService.getPronunciationexerciseById(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: "Pronunciation exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        res.status(500).json({ message: "Error fetching Pronunciation exercise details", error: err });
    }
});

router.get("/api/pronunciation-exercises/slug/:slug", verifyToken, async function(req, res) {
    try {
        const slug = req.params.slug;
        const exercise = await pronunciationexerciseService.getPronunciationexerciseBySlug(slug);
        if (!exercise) {
            return res.status(404).json({ message: "Pronunciation exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        res.status(500).json({ message: "Error fetching Pronunciation exercise details", error: err });
    }
});

router.post('/analyze/:id/:index', upload.single('audio'), async (req, res) => {
    const audioBuffer = req.file.buffer;
    const exerciseId = req.params.id;
    const questionIndex = parseInt(req.params.index, 10);
    try {
        const formData = new FormData();
        formData.append('file', audioBuffer, 'recording.wav');
        formData.append('model', 'whisper-1');
        const response = await axios.post(
            'https://api.openai.com/v1/audio/transcriptions',
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            }
        );
        const transcription = response.data.text;
        const exercise = await pronunciationexerciseService.getPronunciationexerciseById(exerciseId);
        if (!exercise || !exercise.questions || !exercise.questions[questionIndex]) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy bài tập hoặc câu hỏi không tồn tại."
            });
        }
        const correctAnswer = exercise.questions[questionIndex].correctAnswer;
        const { accuracy, detailedResult } = calculateAccuracy(transcription, correctAnswer);
        res.json({
            success: true,
            transcription: transcription,
            accuracy: accuracy,
            detailedResult: detailedResult,
            index: questionIndex
        });
    } catch (error) {
        console.error('Lỗi khi phân tích giọng nói:', error.message);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi phân tích giọng nói',
            detail: error.message
        });
    }
});

function calculateAccuracy(transcription, correctAnswer) {
    const transWords = transcription.toLowerCase().split(/\s+/);
    const correctWords = correctAnswer.toLowerCase().split(/\s+/);
    const totalWords = correctWords.length;
    let matchedWords = 0;
    let detailedResult = [];
    correctWords.forEach((word, i) => {
        if (transWords[i] == word) {
            matchedWords++;
            detailedResult.push({ word: word, correct: true });
        } else {
            detailedResult.push({ word: word, correct: false });
        }
    });
    const accuracy = ((matchedWords / totalWords) * 100).toFixed(2);
    return { accuracy, detailedResult };
}

router.post("/add", async (req, res) => {
    try {
        const pronunciationexercise = {
            title: req.body.title,
            questions: req.body.questions || [],
            slug: req.body.slug,
            sort: parseInt(req.body.sort),
            display: req.body.display !== undefined ? req.body.display == "true" : true
        };
        const result = await pronunciationexerciseService.insertPronunciationexercise(pronunciationexercise);
        res.status(201).json({ success: true, message: "Bài luyện tập phát âm đã được thêm thành công !", result});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error adding pronunciation exercise", error: err.message });
    }
});

router.get("/api/:id", async function (req, res) {
    try {
        const exercise = await pronunciationexerciseService.getPronunciationexerciseById(req.params.id);
        if (!exercise) {
        return res.status(404).json({ message: "Pronunciation Exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching pronunciation exercise:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/update/:id", async (req, res) => {
    try {
        const existingPronunciationExercise = await pronunciationexerciseService.getPronunciationexerciseById(req.params.id);
        if (!existingPronunciationExercise) {
            return res.status(404).json({ message: "Bài luyện tập phát âm không tìm thấy." });
        }
        const pronunciationexercise = {
            title: req.body.title,
            questions: req.body.questions || [],
            slug: req.body.slug,
            sort: parseInt(req.body.sort),
            display: req.body.display !== undefined ? req.body.display == "true" : true
        };
        const result = await pronunciationexerciseService.updatePronunciationexercise(req.params.id, pronunciationexercise);
        res.json({ message: "Bài luyện tập phát âm đã được cập nhật thành công !", result });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating pronunciation exercise", error: err.message });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedExercise = await pronunciationexerciseService.deletePronunciationexercise(req.params.id);
        if (!deletedExercise) {
            return res.status(404).json({ success: false, message: "Bài luyện tập phát âm không tìm thấy." });
        }
        res.json({ success: true, message: "Bài luyện tập phát âm đã xóa thành công !" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting pronunciation exercise", error: err.message });
    }
});

module.exports = router;