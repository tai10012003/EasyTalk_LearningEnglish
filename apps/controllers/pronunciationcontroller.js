const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const PronunciationService = require("../services/pronunciationService");
const UserProgressService = require("./../services/userprogressService");
const userProgressService = new UserProgressService();
const pronunciationService = new PronunciationService();

router.get("/api/pronunciation-list", verifyToken, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 3;  
    try {
        const { pronunciations, totalPronunciations } = await pronunciationService.getPronunciationList(page, limit);
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
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPronunciationList = await pronunciationService.getPronunciationList(1, 1);
            const firstPronunciation = firstPronunciationList.pronunciations[0];
            userProgress = await userProgressService.createUserProgress(userId, null, null, null, firstPronunciation ? firstPronunciation._id : null);
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

router.post("/api/pronunciation/complete/:id", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const pronunciationId = req.params.id;
        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPronunciationList = await pronunciationService.getPronunciationList(1, 1);
            const firstPronunciation = firstPronunciationList.pronunciations[0];
            userProgress = await userProgressService.createUserProgress(userId, null, null, null, firstPronunciation ? firstPronunciation._id : null);
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
            userProgress = await userProgressService.unlockNextPronunciation(userProgress, nextPronunciation._id, 10);
            return res.json({
                success: true,
                message: "Pronunciation completed. Next lesson unlocked.",
                unlockedPronunciations: userProgress.unlockedPronunciations
            });
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
            await userProgressService.updateUserProgress(userProgress);
            return res.json({
                success: true,
                message: "Pronunciation completed. You have finished all lessons.",
                unlockedPronunciations: userProgress.unlockedPronunciations
            });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Error processing completion", error: err.message });
    }
});

module.exports = router;