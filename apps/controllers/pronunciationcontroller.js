const express = require("express");
const router = express.Router();
const PronunciationService = require("../services/pronunciationService");

router.get("/api/pronunciation-list", async function (req, res) {
    const pronunciationService = new PronunciationService();
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

router.get("/api/pronunciation/:id", async function (req, res) {
    const pronunciationService = new PronunciationService();
    try {
        const pronunciation = await pronunciationService.getPronunciation(req.params.id);

        if (!pronunciation) {
            return res.status(404).json({ message: "Pronunciation not found" });
        }

        res.json(pronunciation);
    } catch (err) {
        res.status(500).json({ message: "Error fetching pronunciation details", error: err });
    }
});

module.exports = router;