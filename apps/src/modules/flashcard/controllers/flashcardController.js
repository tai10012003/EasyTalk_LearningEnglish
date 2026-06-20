const express = require("express");
const { ObjectId } = require("mongodb");
const router = express.Router();
const multer = require("multer");
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const FlashcardService = require("../services/flashcardService");
const { validateFlashcardListInput, validateFlashcardInput, validateDifficultyUpdates } = require("../validators/flashcardValidator");
const { buildDifficultyUpdateOperations } = require("../repositories/queries/flashcardCalculator");
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

const flashcardService = new FlashcardService();
let userProgressService = null;

function setUserProgressService(service) {
    userProgressService = service;
}

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/api/flashcard-list", verifyToken, asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const tab = req.query.tab || "explore";
    const userId = req.user.id;
    const data = await flashcardService.getFlashcardList(page, limit, tab, userId);
    res.json({ success: true, ...data });
}));

router.post("/create", verifyToken, asyncHandler(async (req, res) => {
    const validation = validateFlashcardListInput(req.body);
    if(!validation.valid) {
        return res.status(400).json({ 
            success: false, 
            message: validation.errors.join(', ') 
        });
    }
    const userId = req.user.id;
    const result = await flashcardService.insertFlashcardList(req.body, userId);
    res.status(201).json({ success: true, flashcardList: result });
}));

router.delete("/:id", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await flashcardService.deleteFlashcardList(req.params.id, userId);
    if(!result || result.deletedCount == 0) {
        return res.status(404).json({ 
            success: false, 
            message: "Flashcard list not found" 
        });
    }
    res.json({ success: true, message: "Flashcard list đã bị xóa" });
}));

router.put("/flashcardlist/:id", verifyToken, asyncHandler(async (req, res) => {
    const validation = validateFlashcardListInput(req.body);
    if(!validation.valid) {
        return res.status(400).json({ 
            success: false, 
            message: validation.errors.join(', ') 
        });
    }
    const userId = req.user.id;
    const result = await flashcardService.updateFlashcardList(req.params.id, req.body, userId);
    res.json({ success: true, flashcardList: result });
}));

router.get("/api/flashcardlist/:id", verifyToken, asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const userId = req.user.id;
    const result = await flashcardService.getFlashcardListById(req.params.id, page, limit, userId);
    res.json({ success: true, ...result });
}));

router.post("/flashcardlist/:id", verifyToken, upload.single("image"), asyncHandler(async (req, res) => {
    const validation = validateFlashcardInput({ ...req.body, flashcardList: req.params.id });
    if(!validation.valid) {
        return res.status(400).json({ 
            success: false, 
            message: validation.errors.join(', ') 
        });
    }
    const userId = req.user.id;
    const newFlashcard = await flashcardService.insertFlashcard({
        ...req.body,
        imageBuffer: req.file ? req.file.buffer : null,
        flashcardList: req.params.id,
    }, userId);
    res.status(201).json({ success: true, flashcard: newFlashcard });
}));

router.put("/update-flashcard/:id", verifyToken, upload.single("image"), asyncHandler(async (req, res) => {
    const validation = validateFlashcardInput({ ...req.body, flashcardList: 'temp' });
    if(!validation.valid && validation.errors[0] !== 'Flashcard list is required') {
        return res.status(400).json({ 
            success: false, 
            message: validation.errors.join(', ') 
        });
    }
    const userId = req.user.id;
    const updated = await flashcardService.updateFlashcard(
        req.params.id,
        req.body,
        req.file ? req.file.buffer : null,
        userId
    );
    res.json({ 
        success: true, 
        message: "Cập nhật thành công", 
        updatedFlashcard: updated 
    });
}));

router.put("/update-difficulties", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { updates } = req.body;
    const validation = validateDifficultyUpdates(updates);
    if(!validation.valid) {
        return res.status(400).json({ 
            success: false, 
            message: validation.error 
        });
    }
    const bulkOps = buildDifficultyUpdateOperations(updates, userId);
    const result = await flashcardService.updateFlashcardDifficulty(bulkOps);
    await userProgressService.incrementDailyFlashcardReview(userId, updates.length);
    res.json({ 
        success: true, 
        message: `Updated ${updates.length} flashcards`,
        updatedCount: result.modifiedCount 
    });
}));

router.delete("/delete-flashcard/:id", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await flashcardService.deleteFlashcard(req.params.id, userId);
    if(!result || result.deletedCount == 0) {
        return res.status(404).json({ 
            success: false, 
            message: "Flashcard not found" 
        });
    }
    res.json({ success: true, message: "Flashcard đã bị xóa" });
}));

router.get("/flashcardlist/:listId/review", verifyToken, asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await flashcardService.getFlashcardReview(req.params.listId, userId);
    res.json({ success: true, ...result });
}));

module.exports = router;
module.exports.setUserProgressService = setUserProgressService;