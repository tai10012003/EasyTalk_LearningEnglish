const express = require("express");
const router = express.Router();
const multer = require('multer');
const verifyToken = require("../../../shared/middleware/verifyToken");
const { cacheMiddleware } = require("../../../shared/middleware/cacheMiddleware");
const PronunciationExerciseService = require("../services/pronunciationexerciseService");
const SpeechAnalysisService = require("../services/speechAnalysisService");
const UserProgressService = require("../../userprogress/services/userprogressService");
const { validatePronunciationExerciseInput } = require("../validators/pronunciationexerciseValidator");
const { calculateAccuracy } = require("../utils/accuracyCalculator");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const pronunciationexerciseService = new PronunciationExerciseService();
const speechAnalysisService = new SpeechAnalysisService();
const userProgressService = new UserProgressService();

router.get("/api/pronunciation-exercises", verifyToken, cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const role = req.user.role || "user";
        const { pronunciationexercises, totalExercises } = await pronunciationexerciseService.getPronunciationexerciseList(page, limit, role);
        const totalPages = Math.ceil(totalExercises / limit);
        res.json({success: true, data: pronunciationexercises, currentPage: page, totalPages });
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
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await pronunciationexerciseService.getPronunciationexerciseList(1, 1);
            const firstPronunciationExercise = firstPage?.pronunciationexercises?.[0] || null;
            userProgress = await userProgressService.createUserProgress(userId, null, null, null, null, null, firstPronunciationExercise?._id || null, null, null);
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
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No audio file provided'
            });
        }
        const audioBuffer = req.file.buffer;
        const exerciseId = req.params.id;
        const questionIndex = parseInt(req.params.index, 10);
        const exercise = await pronunciationexerciseService.getPronunciationexerciseById(exerciseId);
        const analysisResult = await speechAnalysisService.analyzeWithExercise(audioBuffer, exercise, questionIndex);
        if (!analysisResult.success) {
            return res.status(400).json({
                success: false,
                message: analysisResult.error
            });
        }
        const { accuracy, detailedResult } = calculateAccuracy(analysisResult.transcription, analysisResult.correctAnswer);
        res.json({
            success: true,
            transcription: analysisResult.transcription,
            accuracy: accuracy,
            detailedResult: detailedResult,
            index: questionIndex
        });
    } catch (error) {
        console.error('Lỗi khi phân tích giọng nói:', error.message);
        res.status(500).json({ success: false, message: 'Lỗi khi phân tích giọng nói', detail: error.message });
    }
});

router.post("/api/pronunciation-exercises/complete/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const pronunciationexerciseId = req.params.id;
        const exercise = await pronunciationexerciseService.getPronunciationexerciseById(pronunciationexerciseId);
        if (!exercise) {
            return res.status(404).json({ 
                success: false, 
                message: "Pronunciation exercise not found" 
            });
        }
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await pronunciationexerciseService.getPronunciationexerciseList(1, 1);
            const firstPronunciationExercise = firstPage?.pronunciationexercises?.[0] || null;
            userProgress = await userProgressService.createUserProgress(userId, null, null, null, null, null, firstPronunciationExercise?._id || null, null, null);
        }
        const isUnlocked = (userProgress.unlockedPronunciationExercises || []).some(s => s.toString() == pronunciationexerciseId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ 
                success: false, 
                message: "You cannot complete a locked pronunciation exercise." 
            });
        }
        const all = await pronunciationexerciseService.getPronunciationexerciseList(1, 10000);
        const allPronunciationExercises = all?.pronunciationexercises || [];
        const idx = allPronunciationExercises.findIndex(s => s._id.toString() == pronunciationexerciseId.toString());
        let nextPronunciationExercise = null;
        if (idx !== -1 && idx < allPronunciationExercises.length - 1) {
            nextPronunciationExercise = allPronunciationExercises[idx + 1];
        }
        if (nextPronunciationExercise) {
            userProgress = await userProgressService.unlockNextPronunciationExercise(userProgress, nextPronunciationExercise._id, 10);
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
        }
        await userProgressService.updateUserProgress(userProgress);
        const updatedUserProgress = await userProgressService.getUserProgressByUserId(userId);
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
        const validation = validatePronunciationExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
        const pronunciationexercise = {
            title: req.body.title,
            questions: req.body.questions || [],
            slug: req.body.slug,
            sort: parseInt(req.body.sort),
            display: req.body.display !== undefined ? req.body.display == "true" : true
        };
        const result = await pronunciationexerciseService.insertPronunciationexercise(pronunciationexercise);
        res.status(201).json({ success: true, message: "Bài luyện tập phát âm đã được thêm thành công !", result });
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
        const validation = validatePronunciationExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ success: false, message: validation.errors.join(', ') });
        }
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