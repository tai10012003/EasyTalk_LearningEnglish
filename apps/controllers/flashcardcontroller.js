const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const { FlashcardService } = require("./../services");
const { UserprogressService } = require("./../services");
const { cacheMiddleware } = require('../util/cacheMiddleware');
const flashcardService = new FlashcardService();
const userprogressService = new UserprogressService();
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/api/flashcard-list", verifyToken, cacheMiddleware(300), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const tab = req.query.tab || "explore";
    const userId = req.user.id;
    const data = await flashcardService.getFlashcardList(page, limit, tab, userId);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/create", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await flashcardService.insertFlashcardList(req.body, userId);
    res.status(201).json({ success: true, flashcardList: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await flashcardService.deleteFlashcardList(req.params.id, userId);
    if (!result || result.deletedCount == 0) {
      return res.status(404).json({ success: false, message: "Flashcard list not found" });
    }
    res.json({ success: true, message: "Flashcard list đã bị xóa" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/flashcardlist/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await flashcardService.updateFlashcardList(req.params.id, req.body, userId);
    res.json({ success: true, flashcardList: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/api/flashcardlist/:id", verifyToken, cacheMiddleware(300), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const userId = req.user.id;
    const result = await flashcardService.getFlashcardListById(req.params.id, page, limit, userId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/flashcardlist/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const userId = req.user.id;
    const newFlashcard = await flashcardService.insertFlashcard({
      ...req.body,
      imageBuffer: req.file ? req.file.buffer : null,
      flashcardList: req.params.id,
    }, userId);
    res.status(201).json({ success: true, flashcard: newFlashcard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/update-flashcard/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const userId = req.user.id;
    const updated = await flashcardService.updateFlashcard(
      req.params.id,
      req.body,
      req.file ? req.file.buffer : null,
      userId
    );
    res.json({ success: true, message: "Cập nhật thành công", updatedFlashcard: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/update-difficulty/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { difficulty } = req.body;
    if (!difficulty || ![1, 2, 3].includes(difficulty)) {
      return res.status(400).json({ success: false, message: "Invalid difficulty level" });
    }
    await flashcardService.updateFlashcardDifficulty(req.params.id, difficulty, userId);
    await userprogressService.incrementDailyFlashcardReview(userId);
    res.json({ success: true, message: "Difficulty updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/delete-flashcard/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await flashcardService.deleteFlashcard(req.params.id, userId);
    if (!result || result.deletedCount == 0) {
      return res.status(404).json({ success: false, message: "Flashcard not found" });
    }
    res.json({ success: true, message: "Flashcard đã bị xóa" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/flashcardlist/:listId/review", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await flashcardService.getFlashcardReview(req.params.listId, userId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;