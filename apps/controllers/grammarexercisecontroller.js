const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const { cacheMiddleware } = require("./../util/cacheMiddleware");
const { GrammarexerciseService, UserprogressService } = require("./../services");
const grammarexerciseService = new GrammarexerciseService();
const userprogressService = new UserprogressService();

router.get("/api/grammar-exercises", verifyToken, cacheMiddleware(300), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const role = req.user.role || "user";
        const { grammarexercises, totalExercises } = await grammarexerciseService.getGrammarexerciseList(page, limit, role);
        const totalPages = Math.ceil(totalExercises / limit);
        res.json({
          success: true,
          data: grammarexercises,
          currentPage: page,
          totalPages,
        });
    } catch (error) {
        console.error("Error fetching grammar exercises:", error);
        res.status(500).json({ success: false, message: "Error fetching grammar exercises", error: error.message });
    }
});

router.get("/api/grammar-exercises/:id", verifyToken, async function (req, res) {
    try {
        const userId = req.user.id;
        const grammarexerciseId = req.params.id;
        const exercise = await grammarexerciseService.getGrammarexerciseById(grammarexerciseId);
        if (!exercise) {
            return res.status(404).json({ message: "Grammar exercise not found." });
        }
        let userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await grammarexerciseService.getGrammarexerciseList(1, 1);
            const firstGrammarExercise = (firstPage && firstPage.grammarexercises && firstPage.grammarexercises[0]) ? firstPage.grammarexercises[0] : null;
            userProgress = await userprogressService.createUserProgress(userId, null, null, null, null, firstGrammarExercise ? firstGrammarExercise._id : null, null, null, null);
        }
        const isUnlocked = (userProgress.unlockedGrammarExercises || []).some(s => s.toString() == grammarexerciseId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ success: false, message: "This grammar exercise is locked for you. Please complete previous grammar exercise first." });
        }
        res.json({ exercise, userProgress });
    } catch (err) {
        res.status(500).json({ message: "Error fetching grammar exercise details", error: err });
    }
});

router.get("/api/grammar-exercises/slug/:slug", verifyToken, cacheMiddleware(300), async function(req, res) {
    try {
        const slug = req.params.slug;
        const exercise = await grammarexerciseService.getGrammarexerciseBySlug(slug);
        if (!exercise) {
            return res.status(404).json({ message: "Grammar exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        res.status(500).json({ message: "Error fetching Grammar exercise details", error: err });
    }
});

router.post("/api/grammar-exercises/complete/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const grammarexerciseId = req.params.id;
        const exercise = await grammarexerciseService.getGrammarexerciseById(grammarexerciseId);
        if (!exercise) {
            return res.status(404).json({ success: false, message: "Grammar exercise not found" });
        }
        let userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await grammarexerciseService.getGrammarexerciseList(1, 1);
            const firstGrammarExercise = (firstPage?.grammarexercises?.[0]) || null;
            userProgress = await userprogressService.createUserProgress(userId, null, null, null, null, firstGrammarExercise ? firstGrammarExercise._id : null, null, null, null);
        }
        const isUnlocked = (userProgress.unlockedGrammarExercises || []).some(s => s.toString() == grammarexerciseId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ success: false, message: "You cannot complete a locked grammar exercise." });
        }
        const all = await grammarexerciseService.getGrammarexerciseList(1, 10000);
        const allGrammarExercises = all?.grammarexercises || [];
        const idx = allGrammarExercises.findIndex(s => s._id.toString() == grammarexerciseId.toString());
        let nextGrammarExercise = null;
        if (idx !== -1 && idx < allGrammarExercises.length - 1) {
            nextGrammarExercise = allGrammarExercises[idx + 1];
        }
        if (nextGrammarExercise) {
            userProgress = await userprogressService.unlockNextGrammarExercise(userProgress, nextGrammarExercise._id, 10);
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
        }
        await userprogressService.updateUserProgress(userProgress);
        const updatedUserProgress = await userprogressService.getUserProgressByUserId(userId);
        return res.json({
            success: true,
            message: nextGrammarExercise ? "Grammar exercise completed. Next grammar exercise unlocked." : "Grammar exercise completed. You have finished all grammar exercise.",
            userProgress: {
                unlockedGrammarExercises: updatedUserProgress.unlockedGrammarExercises,
                experiencePoints: updatedUserProgress.experiencePoints,
                streak: updatedUserProgress.streak,
                maxStreak: updatedUserProgress.maxStreak,
                studyDates: updatedUserProgress.studyDates
            }
        });
    } catch (error) {
        console.error("Error completing grammar exercise: ", error);
        res.status(500).json({ success: false, message: "Error processing completion", error: error.message });
    }
});

router.post("/add", async (req, res) => {
    try {
        const grammarexercise = {
            title: req.body.title,
            questions: req.body.questions || [],
            slug: req.body.slug,
            sort: parseInt(req.body.sort),
            display: req.body.display !== undefined ? req.body.display == "true" : true
        };
        const result = await grammarexerciseService.insertGrammarexercise(grammarexercise);
        res.status(201).json({ success: true, message: "Bài luyện tập ngữ pháp đã được thêm thành công !", result});
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Error adding grammar exercise", error: err.message });
    }
});

router.get("/api/:id", cacheMiddleware(600), async function (req, res) {
    try {
        const exercise = await grammarexerciseService.getGrammarexerciseById(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: "Grammar Exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching grammar exercise:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/update/:id", async (req, res) => {
    try {
        const existingGrammarExercise = await grammarexerciseService.getGrammarexerciseById(req.params.id);
        if (!existingGrammarExercise) {
            return res.status(404).json({ message: "Bài luyện tập ngữ pháp không tìm thấy." });
        }
        const grammarexercise = {
            title: req.body.title,
            questions: req.body.questions || [],
            slug: req.body.slug,
            sort: parseInt(req.body.sort),
            display: req.body.display !== undefined ? req.body.display == "true" : true
        };
        const result = await grammarexerciseService.updateGrammarexercise(req.params.id, grammarexercise);
        res.json({ message: "Bài luyện tập ngữ pháp đã được cập nhật thành công !", result });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Error updating grammar exercise", error: err.message });
    }
});

router.delete("/delete/:id", async (req, res) => {
    try {
        const deletedExercise = await grammarexerciseService.deleteGrammarexercise(req.params.id);
        if (!deletedExercise || deletedExercise.deletedCount == 0) {
            return res.status(404).json({ success: false, message: "Bài luyện tập ngữ pháp không tìm thấy." });
        }
        res.json({ success: true, message: "Bài luyện tập ngữ pháp đã xóa thành công !" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Error deleting grammar exercise", error: err.message });
    }
});

module.exports = router;