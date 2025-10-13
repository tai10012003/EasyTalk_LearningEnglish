const express = require("express");
const router = express.Router();
const PronunciationExerciseService = require("../services/pronunciationexerciseService");
const pronunciationexerciseService = new PronunciationExerciseService();
const multer = require('multer');
const axios = require('axios'); 
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const FormData = require('form-data');

router.get("/", async (req, res) => {
    try {
        const { pronunciationexercises } = await pronunciationexerciseService.getPronunciationexerciseList();
        res.render("pronunciationexercises/pronunciationexercise-list", { exercises: pronunciationexercises });
    } catch (err) {
        console.error("Error retrieving pronunciation exercises:", err);
        res.status(500).send("Error retrieving pronunciation exercises: " + err.message);
    }
});

router.get("/api/pronunciation-exercises", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const { pronunciationexercises, totalExercises } = await pronunciationexerciseService.getPronunciationexerciseList(page, limit);
    
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


router.get('/detail/:id', (req, res) => {
    res.render('pronunciationexercises/pronunciationexercise-detail');
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
        if (transWords[i] === word) {
            matchedWords++;
            detailedResult.push({ word: word, correct: true });
        } else {
            detailedResult.push({ word: word, correct: false });
        }
    });
    const accuracy = ((matchedWords / totalWords) * 100).toFixed(2);
    return { accuracy, detailedResult };
}


module.exports = router;
