const express = require("express");
const router = express.Router();
const verifyToken = require("../../../shared/middleware/verifyToken");
const { cacheMiddleware } = require("../../../shared/middleware/cacheMiddleware");
const VocabularyExerciseService = require("../services/vocabularyexerciseService");
const UserProgressService = require("../../userprogress/services/userprogressService");
const { validateVocabularyExerciseInput } = require("../validators/vocabularyexerciseValidator");

const vocabularyexerciseService = new VocabularyExerciseService();
const userProgressService = new UserProgressService();

router.get("/api/vocabulary-exercises", verifyToken, cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const role = req.user.role || "user";
        const { vocabularyexercises, totalExercises } = await vocabularyexerciseService.getVocabularyexerciseList(page, limit, role);
        const totalPages = Math.ceil(totalExercises / limit);
        res.json({
            success: true,
            data: vocabularyexercises,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error("Error fetching vocabulary exercises:", error);
        res.status(500).json({ success: false, message: "Error fetching vocabulary exercises", error: error.message });
    }
});

router.get("/api/vocabulary-exercises/:id", verifyToken, async function (req, res) {
    try {
        const userId = req.user.id;
        const vocabularyexerciseId = req.params.id;
        const exercise = await vocabularyexerciseService.getVocabularyexerciseById(vocabularyexerciseId);
        if (!exercise) {
            return res.status(404).json({ message: "Vocabulary exercise not found." });
        }
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await vocabularyexerciseService.getVocabularyexerciseList(1, 1);
            const firstVocabularyExercise = (firstPage && firstPage.vocabularyexercises && firstPage.vocabularyexercises[0]) ? firstPage.vocabularyexercises[0] : null;
            userProgress = await userProgressService.createUserProgress(userId, null, null, null, null, null, null, firstVocabularyExercise ? firstVocabularyExercise._id : null, null);
        }
        const isUnlocked = (userProgress.unlockedVocabularyExercises || []).some(s => s.toString() == vocabularyexerciseId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ 
                success: false, 
                message: "This vocabulary exercise is locked for you. Please complete previous vocabulary exercise first." 
            });
        }
        res.json({ exercise, userProgress });
    } catch (err) {
        res.status(500).json({ message: "Error fetching vocabulary exercise details", error: err });
    }
});

router.get("/api/vocabulary-exercises/slug/:slug", verifyToken, cacheMiddleware(300), async function(req, res) {
    try {
        const slug = req.params.slug;
        const exercise = await vocabularyexerciseService.getVocabularyexerciseBySlug(slug);
        if (!exercise) {
            return res.status(404).json({ message: "Vocabulary exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        res.status(500).json({ message: "Error fetching Vocabulary exercise details", error: err });
    }
});

router.post("/api/vocabulary-exercises/complete/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const vocabularyexerciseId = req.params.id;
        const exercise = await vocabularyexerciseService.getVocabularyexerciseById(vocabularyexerciseId);
        if (!exercise) {
            return res.status(404).json({ success: false, message: "Vocabulary exercise not found" });
        }
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await vocabularyexerciseService.getVocabularyexerciseList(1, 1);
            const firstVocabularyExercise = (firstPage?.vocabularyexercises?.[0]) || null;
            userProgress = await userProgressService.createUserProgress(userId, null, null, null, null, null, null, firstVocabularyExercise ? firstVocabularyExercise._id : null, null);
        }
        const isUnlocked = (userProgress.unlockedVocabularyExercises || []).some(s => s.toString() == vocabularyexerciseId.toString());
        if (!isUnlocked) {
            return res.status(403).json({
                success: false,
                message: "You cannot complete a locked vocabulary exercise." 
            });
        }
        const all = await vocabularyexerciseService.getVocabularyexerciseList(1, 10000);
        const allVocabularyExercises = all?.vocabularyexercises || [];
        const idx = allVocabularyExercises.findIndex(s => s._id.toString() == vocabularyexerciseId.toString());
        let nextVocabularyExercise = null;
        if (idx !== -1 && idx < allVocabularyExercises.length - 1) {
            nextVocabularyExercise = allVocabularyExercises[idx + 1];
        }
        if (nextVocabularyExercise) {
            userProgress = await userProgressService.unlockNextVocabularyExercise(userProgress, nextVocabularyExercise._id, 10);
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
        }
        await userProgressService.updateUserProgress(userProgress);
        const updatedUserProgress = await userProgressService.getUserProgressByUserId(userId);
        return res.json({
            success: true,
            message: nextVocabularyExercise ? "Vocabulary exercise completed. Next vocabulary exercise unlocked." : "Vocabulary exercise completed. You have finished all vocabulary exercise.",
            userProgress: {
                unlockedVocabularyExercises: updatedUserProgress.unlockedVocabularyExercises,
                experiencePoints: updatedUserProgress.experiencePoints,
                streak: updatedUserProgress.streak,
                maxStreak: updatedUserProgress.maxStreak,
                studyDates: updatedUserProgress.studyDates
            }
        });
    } catch (error) {
        console.error("Error completing vocabulary exercise: ", error);
        res.status(500).json({ 
            success: false, 
            message: "Error processing completion", 
            error: error.message 
        });
    }
});

router.post("/add", async (req, res) => {
    try {
        const validation = validateVocabularyExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ 
                success: false, 
                message: validation.errors.join(', ') 
            });
        }
        const vocabularyexercise = {
            title: req.body.title,
            questions: req.body.questions || [],
            slug: req.body.slug,
            sort: parseInt(req.body.sort),
            display: req.body.display !== undefined ? req.body.display == "true" : true
        };
        const result = await vocabularyexerciseService.insertVocabularyexercise(vocabularyexercise);
        res.status(201).json({ 
            success: true, 
            message: "Bài luyện tập từ vựng đã được thêm thành công !", 
            result
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ 
            success: false, 
            message: "Error adding vocabulary exercise", 
            error: err.message 
        });
    }
});

router.get("/api/:id", cacheMiddleware(600), async function (req, res) {
    try {
        const exercise = await vocabularyexerciseService.getVocabularyexerciseById(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: "Vocabulary Exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching vocabulary exercise:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/update/:id", async (req, res) => {
    try {
        const validation = validateVocabularyExerciseInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ 
                success: false, 
                message: validation.errors.join(', ') 
            });
        }
        const existingVocabularyExercise = await vocabularyexerciseService.getVocabularyexerciseById(req.params.id);
        if (!existingVocabularyExercise) {
            return res.status(404).json({ message: "Bài luyện tập từ vựng không tìm thấy." });
        }
        const vocabularyexercise = {
            title: req.body.title,
            questions: req.body.questions || [],
            slug: req.body.slug,
            sort: parseInt(req.body.sort),
            display: req.body.display !== undefined ? req.body.display == "true" : true
        };
        const result = await vocabularyexerciseService.updateVocabularyexercise(req.params.id, vocabularyexercise);
        res.json({ 
            message: "Bài luyện tập từ vựng đã được cập nhật thành công !", 
            result 
        });
    } catch (err) {
        return res.status(500).json({ 
            success: false, 
            message: "Error updating vocabulary exercise", 
            error: err.message 
        });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedExercise = await vocabularyexerciseService.deleteVocabularyexercise(req.params.id);
        if (!deletedExercise || deletedExercise.deletedCount == 0) {
            return res.status(404).json({ 
                success: false, 
                message: "Bài luyện tập từ vựng không tìm thấy." 
            });
        }
        res.json({ 
            success: true, 
            message: "Bài luyện tập từ vựng đã xóa thành công !" 
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            message: "Error deleting vocabulary exercise", 
            error: err.message 
        });
    }
});

module.exports = router;