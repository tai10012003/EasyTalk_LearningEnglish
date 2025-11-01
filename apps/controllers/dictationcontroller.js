const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const { DictationService, UserprogressService } = require("../services");
const dictationService = new DictationService();
const userprogressService = new UserprogressService();

router.get("/api/dictation-exercises", verifyToken, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const role = req.user.role || "user";
    try {
        const { dictationExercises, totalDictationExercises } = await dictationService.getDictationList(page, limit, role);
        const totalPages = Math.ceil(totalDictationExercises / limit);
        res.json({
            success: true,
            dictationExercises,
            currentPage: page,
            totalPages,
        });
    } catch (error) {
        console.error("Error fetching dictation exercises:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching dictation exercises",
        });
    }
});

router.get("/api/dictationexercise/:id", verifyToken, async function (req, res) {
    try {
        const userId = req.user.id;
        const dictationId = req.params.id;
        const dictationExercise = await dictationService.getDictation(dictationId);
        if (!dictationExercise) {
            return res.status(404).json({ message: "Dictation exercise not found." });
        }
        let userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await dictationService.getDictationList(1, 1);
            const firstDictationExercise = (firstPage && firstPage.dictationExercises && firstPage.dictationExercises[0]) ? firstPage.dictationExercises[0] : null;
            userProgress = await userprogressService.createUserProgress(userId, null, null, null, null, null, null, null, firstDictationExercise ? firstDictationExercise._id : null);
        }
        const isUnlocked = (userProgress.unlockedDictations || []).some(s => s.toString() == dictationId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ success: false, message: "This dictation exercise is locked for you. Please complete previous dictation exercise first." });
        }
        res.json({ success: true, data: dictationExercise, userProgress });
    } catch (err) {
        res.status(500).json({ message: "Error fetching dictation exercise details", error: err });
    }
});

router.get("/api/dictationexercise/slug/:slug", verifyToken, async function(req, res) {
    try {
        const slug = req.params.slug;
        const dictationExercise = await dictationService.getDictationBySlug(slug);
        if (!dictationExercise) {
            return res.status(404).json({ success: false, message: "Dictation exercise not found" });
        }
        res.json({ success: true, data: dictationExercise });
    } catch (error) {
        console.error("Error fetching dictation exercise details:", error);
        res.status(500).json({ success: false, message: "Error fetching dictation exercise details", error: error.message });
    }
});

router.post("/add", async function (req, res) {
    try {
        const dictationexercises = {
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
            slug: req.body.slug,
            sort: parseInt(req.body.sort),
            display: req.body.display !== undefined ? req.body.display == "true" : true
        };
        const result = await dictationService.insertDictation(dictationexercises);
        res.status(201).json({ message: "Bài nghe chép chính tả đã được thêm thành công!", result });
    } catch (error) {
        res.status(500).json({ message: "Error adding dictation exercise", error });
    }
});

router.post("/api/dictation-exercises/complete/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const dictationId = req.params.id;
        const exercise = await dictationService.getDictation(dictationId);
        if (!exercise) {
            return res.status(404).json({ success: false, message: "Dictation exercise not found" });
        }
        let userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await dictationService.getDictationList(1, 1);
            const firstDictationExercise = (firstPage?.dictationExercises?.[0]) || null;
            userProgress = await userprogressService.createUserProgress(userId, null, null, null, null, null, null, firstDictationExercise ? firstDictationExercise._id : null);
        }
        const isUnlocked = (userProgress.unlockedDictations || []).some(s => s.toString() == dictationId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ success: false, message: "You cannot complete a locked dictation exercise." });
        }
        const all = await dictationService.getDictationList(1, 10000);
        const allDictationExercises = all?.dictationExercises || [];
        const idx = allDictationExercises.findIndex(s => s._id.toString() == dictationId.toString());
        let nextDictationExercise = null;
        if (idx !== -1 && idx < allDictationExercises.length - 1) {
            nextDictationExercise = allDictationExercises[idx + 1];
        }
        if (nextDictationExercise) {
            userProgress = await userprogressService.unlockNextDictation(userProgress, nextDictationExercise._id, 10);
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
        }
        await userprogressService.updateUserProgress(userProgress);
        const updatedUserProgress = await userprogressService.getUserProgressByUserId(userId);
        return res.json({
            success: true,
            message: nextDictationExercise ? "Dictation exercise completed. Next dictation exercise unlocked." : "Dictation exercise completed. You have finished all Dictation exercise.",
            userProgress: {
                unlockedDictations: updatedUserProgress.unlockedDictations,
                experiencePoints: updatedUserProgress.experiencePoints,
                streak: updatedUserProgress.streak,
                maxStreak: updatedUserProgress.maxStreak,
                studyDates: updatedUserProgress.studyDates
            }
        });
    } catch (error) {
        console.error("Error completing dictation exercise: ", error);
        res.status(500).json({ success: false, message: "Error processing completion", error: error.message });
    }
});

router.get("/api/:id", async function (req, res) {
    try {
        const exercise = await dictationService.getDictation(req.params.id);
        if (!exercise) {
            return res.status(404).json({ message: "Dictation Exercise not found" });
        }
        res.json(exercise);
    } catch (err) {
        console.error("Error fetching dictation exercise:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/update/:id", async function (req, res) {
    try {
        const dictationexercises = {
            _id: req.params.id,
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
            slug: req.body.slug,
            sort: parseInt(req.body.sort),
            display: req.body.display !== undefined ? req.body.display == "true" : true
        };
        const result = await dictationService.updateDictation(dictationexercises);
        res.json({ message: "Bài nghe chép chính tả đã được cập nhật thành công!", result });
    } catch (error) {
        res.status(500).json({ message: "Error updating dictation exercise", error });
    }
});

router.delete("/delete/:id", async function (req, res) {
    const result = await dictationService.deleteDictation(req.params.id);
    if (result.deletedCount == 0) {
        return res.status(404).json({ message: "Bài nghe chép chính tả không tìm thấy." });
    }
    res.json({ message: "Bài nghe chép chính tả đã xóa thành công!" });
});

module.exports = router;