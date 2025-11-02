const express = require("express");
const router = express.Router();
const multer = require("multer");
const verifyToken = require("./../util/VerifyToken");
const { PronunciationService, UserprogressService } = require("../services");
const userprogressService = new UserprogressService();
const pronunciationService = new PronunciationService();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/api/pronunciation-list", verifyToken, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;  
    try {
        const role = req.user.role || "user";
        const { pronunciations, totalPronunciations } = await pronunciationService.getPronunciationList(page, limit, role);
        const totalPages = Math.ceil(totalPronunciations / limit);
        res.json({
            pronunciations,
            currentPage: page,
            totalPages
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching pronunciations", error: err });
    }
});

router.get("/api/pronunciation/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const pronunciationId = req.params.id;
        let userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPronunciationList = await pronunciationService.getPronunciationList(1, 1);
            const firstPronunciation = firstPronunciationList.pronunciations[0];
            userProgress = await userprogressService.createUserProgress(userId, null, null, null, firstPronunciation ? firstPronunciation._id : null);
        }
        const isUnlocked = (userProgress.unlockedPronunciations || []).some(s => s.toString() == pronunciationId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ success: false, message: "This pronunciation is locked. Complete previous lessons first." });
        }
        const pronunciation = await pronunciationService.getPronunciation(pronunciationId);
        if (!pronunciation) {
            return res.status(404).json({ message: "Pronunciation not found" });
        }
        res.json({ pronunciation, userProgress });
    } catch (err) {
        res.status(500).json({ message: "Error fetching pronunciation details", error: err });
    }
});

router.get("/api/pronunciation/slug/:slug", verifyToken, async function (req, res) {
    try {
        const slug = req.params.slug;
        const pronunciation = await pronunciationService.getPronunciationBySlug(slug);
        if (!pronunciation) {
            return res.status(404).json({ message: "Pronunciation not found" });
        }
        res.json({ pronunciation });
    } catch (err) {
        res.status(500).json({ message: "Error fetching pronunciation details", error: err });
    }
});

router.post("/api/pronunciation/complete/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const pronunciationId = req.params.id;
        let userProgress = await userprogressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPronunciationList = await pronunciationService.getPronunciationList(1, 1);
            const firstPronunciation = firstPronunciationList.pronunciations[0];
            userProgress = await userprogressService.createUserProgress(userId, null, null, null, firstPronunciation ? firstPronunciation._id : null);
        }
        const isUnlocked = (userProgress.unlockedPronunciations || []).some(s => s.toString() == pronunciationId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ success: false, message: "This pronunciation is locked. Complete previous lessons first." });
        }
        const allPronunciationsResp = await pronunciationService.getPronunciationList(1, 10000);
        const allPronunciations = allPronunciationsResp.pronunciations || [];
        const idx = allPronunciations.findIndex(p => p._id.toString() == pronunciationId.toString());
        let nextPronunciation = null;
        if (idx !== -1 && idx < allPronunciations.length - 1) {
            nextPronunciation = allPronunciations[idx + 1];
        }
        if (nextPronunciation) {
            userProgress = await userprogressService.unlockNextPronunciation(userProgress, nextPronunciation._id, 10);
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
        }
        await userprogressService.updateUserProgress(userProgress);
        const updatedUserProgress = await userprogressService.getUserProgressByUserId(userId);
        return res.json({
            success: true,
            message: nextPronunciation 
                ? "Pronunciation completed. Next lesson unlocked." 
                : "Pronunciation completed. You have finished all lessons.",
            userProgress: {
                unlockedPronunciations: updatedUserProgress.unlockedPronunciations,
                experiencePoints: updatedUserProgress.experiencePoints,
                streak: updatedUserProgress.streak,
                maxStreak: updatedUserProgress.maxStreak,
                studyDates: updatedUserProgress.studyDates
            }
        });
    } catch (err) {
        console.error("Error in pronunciation complete:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error processing completion", 
            error: err.message 
        });
    }
});

router.post("/api/add", upload.single("image"), async function (req, res) {
    try {
        let quizzes = [];
        if (req.body.quizzes) {
            try {
                quizzes = JSON.parse(req.body.quizzes);
            } catch (e) {
                console.error("Parse quizzes error:", e);
            }
        }
        const pronunciation = {
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
            images: req.body.images || null,
            quizzes: quizzes,
            slug: req.body.slug,
            sort: parseInt(req.body.sort) || 0,
            display: req.body.display !== undefined ? req.body.display == "true" : true
        };
        const result = await pronunciationService.insertPronunciation(pronunciation, req.file || null);
        res.status(201).json({ message: "Bài học phát âm đã được thêm thành công !", result });
    } catch (error) {
        console.error("Add pronunciation error:", error);
        res.status(500).json({ message: "Error adding pronunciation", error });
    }
});

router.get("/api/:id", async function (req, res) {
    try {
        const pronunciation = await pronunciationService.getPronunciation(req.params.id);
        if (!pronunciation) {
            return res.status(404).json({ message: "Pronunciation not found" });
        }
        res.json(pronunciation);
    } catch (err) {
        console.error("Error fetching pronunciation:", err);
        res.status(500).json({ message: "Server error" });
    }
});

router.put("/api/update/:id", upload.single("image"), async function (req, res) {
    try {
        let quizzes = [];
        if (req.body.quizzes) {
            try {
                quizzes = JSON.parse(req.body.quizzes);
            } catch (e) {
                console.error("Parse quizzes error:", e);
            }
        }
        const existingPronunciation = await pronunciationService.getPronunciation(req.params.id);
        if (!existingPronunciation) {
            return res.status(404).json({ message: "Bài học phát âm không tìm thấy." });
        }
        const pronunciation = {
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
            quizzes: quizzes,
            images: existingPronunciation.images || req.body.images || "",
            slug: req.body.slug,
            sort: parseInt(req.body.sort) || 0,
            display: req.body.display !== undefined ? req.body.display == "true" : true
        };
        const result = await pronunciationService.updatePronunciation(req.params.id, pronunciation, req.file || null);
        res.json({ message: "Bài học phát âm đã được cập nhật thành công !", result });
    } catch (error) {
        console.error("Update pronunciation error:", error);
        res.status(500).json({ message: "Error updating pronunciation", error });
    }
});

router.delete("/api/pronunciation/:id", async function (req, res) {
    try {
        const pronunciation = await pronunciationService.getPronunciation(req.params.id);
        if (!pronunciation) {
            return res.status(404).json({ message: "Bài học phát âm không tìm thấy." });
        }
        const result = await pronunciationService.deletePronunciation(req.params.id);
        if (result.deletedCount == 0) {
            return res.status(404).json({ message: "Bài học phát âm không tìm thấy." });
        }
        res.json({ message: "Bài học phát âm đã xóa thành công !" });
    } catch (error) {
        console.error("Delete pronunciation error:", error);
        res.status(500).json({ message: "Error deleting pronunciation", error: error.message });
    }
});

module.exports = router;