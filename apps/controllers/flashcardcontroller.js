var express = require("express");
var router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const FlashcardService = require("./../services/flashcardService");
const flashcardService = new FlashcardService();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/api/flashcard-list", verifyToken, async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  const page = parseInt(req.query.page) || 1;

  try {
      const { flashcardLists, totalFlashcardLists } = await flashcardService.getFlashcardList(page, limit);
      const totalPages = Math.ceil(totalFlashcardLists / limit);
      res.json({
          flashcardLists,
          currentPage: page,
          totalPages,
      });
  } catch (err) {
      res.status(500).json({ message: "Có lỗi xảy ra", error: err.message });
  }
});


router.post("/create", verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const newFlashcardList = await flashcardService.insertFlashcardList({ name, description });
    res.status(201).json({ success: true, flashcardList: newFlashcardList });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi khi tạo FlashcardList", error: err.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await flashcardService.deleteFlashcardList(req.params.id);
    res.status(200).json({ success: true, message: "Flashcard list đã bị xóa" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Xóa thất bại", error: err.message });
  }
});

router.put("/flashcardlist/:id", verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    const updatedFlashcardList = await flashcardService.updateFlashcardList(req.params.id, { name, description });

    if (!updatedFlashcardList) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh sách" });
    }
    res.status(200).json({ success: true, flashcardList: updatedFlashcardList });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Cập nhật thất bại",
      error: err.message,
    });
  }
});

router.get("/api/flashcardlist/:id", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const { flashcardList, flashcards } = await flashcardService.getFlashcardListById(req.params.id);

    if (!flashcardList) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh sách flashcards." });
    }

    const totalFlashcards = flashcards.length;
    const paginatedFlashcards = flashcards.slice(skip, skip + limit);

    res.json({
      success: true,
      flashcardList,
      flashcards: paginatedFlashcards,
      currentPage: page,
      totalPages: Math.ceil(totalFlashcards / limit),
      totalFlashcards,
      limit,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Có lỗi xảy ra", error: err.message });
  }
});

router.post('/flashcardlist/:id', verifyToken, upload.single('image'), async (req, res) => {
  try {
      const { word, meaning, pos, pronunciation, exampleSentence } = req.body;
      const image = req.file ? req.file.buffer.toString('base64') : null;

      const newFlashcard = await flashcardService.insertFlashcard({
          word,
          meaning,
          pos,
          pronunciation,
          exampleSentence,
          image,
          flashcardList: req.params.id,
      });
      res.status(201).json({ success: true, flashcard: newFlashcard });
  } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Lỗi thêm flashcard', error: err.message });
  }
});

router.delete("/delete-flashcard/:id", verifyToken, async (req, res) => {
  try {
    await flashcardService.deleteFlashcard(req.params.id);
    res.status(200).json({ success: true, message: "Flashcard đã bị xóa" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Xóa thất bại", error: err.message });
  }
});

router.put("/update-flashcard/:id", verifyToken, upload.single("image"), async (req, res) => {
  try {
    const { word, meaning, pos, pronunciation, exampleSentence } = req.body;
    const updatedData = {
      word,
      meaning,
      pos,
      pronunciation,
      exampleSentence,
    };
    if (req.file) {
      updatedData.image = req.file.buffer.toString("base64");
    } else {
      const existingFlashcard = await flashcardService.getFlashcardListById(req.params.id);
      if (existingFlashcard && existingFlashcard.image) {
        updatedData.image = existingFlashcard.image;
      }
    }

    const updatedFlashcard = await flashcardService.updateFlashcard(req.params.id, updatedData);

    if (!updatedFlashcard) {
      return res.status(404).json({ success: false, message: "Flashcard không tồn tại" });
    }
    res.json({
      success: true,
      message: "Flashcard đã được cập nhật thành công.",
      updatedFlashcard,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Đã xảy ra lỗi", error: error.message });
  }
});

router.get("/flashcardlist/:listId/review", verifyToken, async (req, res) => {
  try {
    const { flashcards, flashcardList } = await flashcardService.getFlashcardListById(req.params.listId);

    if (!flashcards || flashcards.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có flashcard nào trong danh sách này.",
      });
    }
    res.json({
      success: true,
      flashcardList,
      flashcards
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi tải flashcard",
      error: err.message,
    });
  }
});

module.exports = router;
