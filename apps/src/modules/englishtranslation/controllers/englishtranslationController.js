const express = require("express");
const router = express.Router();
const { verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");
const EnglishTranslationService = require("../services/englishtranslationService");

let englishTranslationService = new EnglishTranslationService();

function setEnglishTranslationService(service) {
    englishTranslationService = service;
}

router.get("/api/:contentType/:contentId", verifyAdmin, asyncHandler(async (req, res) => {
    const { contentType, contentId } = req.params;
    const translation = await englishTranslationService.getTranslation(contentType, contentId);
    res.json({ translation });
}));

router.put("/api/:contentType/:contentId", verifyAdmin, asyncHandler(async (req, res) => {
    const { contentType, contentId } = req.params;
    const fields = req.body?.fields || {};
    const metadata = {
        sourceSlug: req.body?.sourceSlug || ""
    };
    const result = await englishTranslationService.upsertTranslation(contentType, contentId, fields, metadata);
    res.json({ message: "English translation saved successfully", result });
}));

router.delete("/api/:contentType/:contentId", verifyAdmin, asyncHandler(async (req, res) => {
    const { contentType, contentId } = req.params;
    const result = await englishTranslationService.deleteTranslation(contentType, contentId);
    res.json({ message: "English translation deleted successfully", result });
}));

module.exports = router;
module.exports.setEnglishTranslationService = setEnglishTranslationService;
