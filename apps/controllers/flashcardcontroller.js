const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const { FlashcardService } = require("./../services");
const flashcardService = new FlashcardService();
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/api/flashcard-list", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const data = await flashcardService.getFlashcardList(page, limit);
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/create", verifyToken, async (req, res) => {
  try {
    const result = await flashcardService.insertFlashcardList(req.body);
    res.status(201).json({ success: true, flashcardList: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await flashcardService.deleteFlashcardList(req.params.id);
    res.json({ success: true, message: "Flashcard list đã bị xóa" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/flashcardlist/:id", verifyToken, async (req, res) => {
  try {
    const result = await flashcardService.updateFlashcardList(req.params.id, req.body);
    res.json({ success: true, flashcardList: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/api/flashcardlist/:id", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const result = await flashcardService.getFlashcardListById(req.params.id, page, limit);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/flashcardlist/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const newFlashcard = await flashcardService.insertFlashcard({
      ...req.body,
      image: req.file ? req.file.buffer.toString("base64") : null,
      flashcardList: req.params.id,
    });
    res.status(201).json({ success: true, flashcard: newFlashcard });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put("/update-flashcard/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const updated = await flashcardService.updateFlashcard(
      req.params.id,
      req.body,
      req.file ? req.file.buffer : null
    );
    res.json({ success: true, message: "Cập nhật thành công", updatedFlashcard: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete("/delete-flashcard/:id", verifyToken, async (req, res) => {
  try {
    await flashcardService.deleteFlashcard(req.params.id);
    res.json({ success: true, message: "Flashcard đã bị xóa" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get("/flashcardlist/:listId/review", verifyToken, async (req, res) => {
  try {
    const result = await flashcardService.getFlashcardReview(req.params.listId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;