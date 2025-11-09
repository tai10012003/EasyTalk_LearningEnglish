const express = require("express");
const router = express.Router();
const multer = require('multer');
const axios = require('axios'); 
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const FormData = require('form-data');
const verifyToken = require("./../util/VerifyToken");
const { cacheMiddleware } = require("./../util/cacheMiddleware");
const { PronunciationexerciseService, UserprogressService } = require("../services");
const pronunciationexerciseService = new PronunciationexerciseService();
const userprogressService = new UserprogressService();

router.get("/api/pronunciation-exercises", verifyToken, cacheMiddleware(300), async (req, res) => {
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

router.get("/api/pronunciation-exercises/:id", verifyToken, async function (req, res) {
    try {
        const userId = req.user.id;
        const pronunciationexerciseId = req.params.id;
        const exercise = await pronunciationexerciseService.getPronunciationexerciseById(pronunciationexerciseId);
        if (!exercise) {
            return res.status(404).json({ message: "Pronunciation exercise not found" });
        }
        let userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await pronunciationexerciseService.getPronunciationexerciseList(1, 1);
            const firstPronunciationExercise = (firstPage && firstPage.pronunciationexercises && firstPage.pronunciationexercises[0]) ? firstPage.pronunciationexercises[0] : null;
            userProgress = await userprogressService.createUserProgress(userId, null, null, null, null, null, firstPronunciationExercise ? firstPronunciationExercise._id : null, null, null);
        }
        const isUnlocked = (userProgress.unlockedPronunciationExercises || []).some(s => s.toString() == pronunciationexerciseId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ success: false, message: "This pronunciation exercise is locked for you. Please complete previous pronunciation exercise first." });
        }
        res.json({ exercise, userProgress });
    } catch (err) {
        res.status(500).json({ message: "Error fetching Pronunciation exercise details", error: err });
    }
});

router.get("/api/pronunciation-exercises/slug/:slug", verifyToken, cacheMiddleware(300), async function(req, res) {
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

router.post("/api/pronunciation-exercises/complete/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const pronunciationexerciseId = req.params.id;
        const exercise = await pronunciationexerciseService.getPronunciationexerciseById(pronunciationexerciseId);
        if (!exercise) {
            return res.status(404).json({ success: false, message: "Pronunciation exercise not found" });
        }
        let userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await pronunciationexerciseService.getPronunciationexerciseList(1, 1);
            const firstPronunciationExercise = (firstPage?.pronunciationexercises?.[0]) || null;
            userProgress = await userprogressService.createUserProgress(userId, null, null, null, null, null, firstPronunciationExercise ? firstPronunciationExercise._id : null, null, null);
        }
        const isUnlocked = (userProgress.unlockedPronunciationExercises || []).some(s => s.toString() == pronunciationexerciseId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ success: false, message: "You cannot complete a locked pronunciation exercise." });
        }
        const all = await pronunciationexerciseService.getPronunciationexerciseList(1, 10000);
        const allPronunciationExercises = all?.pronunciationexercises || [];
        const idx = allPronunciationExercises.findIndex(s => s._id.toString() == pronunciationexerciseId.toString());
        let nextPronunciationExercise = null;
        if (idx !== -1 && idx < allPronunciationExercises.length - 1) {
            nextPronunciationExercise = allPronunciationExercises[idx + 1];
        }
        if (nextPronunciationExercise) {
            userProgress = await userprogressService.unlockNextPronunciationExercise(userProgress, nextPronunciationExercise._id, 10);
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
        }
        await userprogressService.updateUserProgress(userProgress);
        const updatedUserProgress = await userprogressService.getUserProgressByUserId(userId);
        return res.json({
            success: true,
            message: nextPronunciationExercise ? "Pronunciation exercise completed. Next pronunciation exercise unlocked." : "Pronunciation exercise completed. You have finished all pronunciation exercise.",
            userProgress: {
                unlockedPronunciationExercises: updatedUserProgress.unlockedPronunciationExercises,
                experiencePoints: updatedUserProgress.experiencePoints,
                streak: updatedUserProgress.streak,
                maxStreak: updatedUserProgress.maxStreak,
                studyDates: updatedUserProgress.studyDates
            }
        });
    } catch (error) {
        console.error("Error completing pronunciation exercise: ", error);
        res.status(500).json({ success: false, message: "Error processing completion", error: error.message });
    }
});

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

router.get("/api/:id", cacheMiddleware(600), async function (req, res) {
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
       if (!deletedExercise || deletedExercise.deletedCount == 0) {
            return res.status(404).json({ success: false, message: "Bài luyện tập phát âm không tìm thấy." });
        }
        res.json({ success: true, message: "Bài luyện tập phát âm đã xóa thành công !" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting pronunciation exercise", error: err.message });
    }
});

module.exports = router;