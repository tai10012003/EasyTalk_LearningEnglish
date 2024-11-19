var express = require("express");
var router = express.Router();
const FlashcardsService = require("./../services/flashcardService");
const flashcardsService = new FlashcardsService();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get("/", async (req, res) => {
    res.render("flashcards/flashcards");
});

router.get("/api/flashcard-list", async (req, res) => {
  const limit = parseInt(req.query.limit) || 2;
  const page = parseInt(req.query.page) || 1;

  try {
      const { flashcardLists, totalFlashcardLists } = await flashcardsService.getFlashcardList(page, limit);
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


router.post("/create", async (req, res) => {
  try {
    const { name, description } = req.body;
    const newFlashcardList = await flashcardsService.insertFlashcardList({ name, description });
    res.status(201).json({ success: true, flashcardList: newFlashcardList });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi khi tạo FlashcardList", error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await flashcardsService.deleteFlashcardList(req.params.id);
    res.status(200).json({ success: true, message: "Flashcard list đã bị xóa" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Xóa thất bại", error: err.message });
  }
});

router.put("/flashcardlist/:id", async (req, res) => {
  try {
    const { name, description } = req.body;
    const updatedFlashcardList = await flashcardsService.updateFlashcardList(req.params.id, { name, description });

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

router.get("/flashcardlist/:id", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const { flashcardList, flashcards } = await flashcardsService.getFlashcardListById(req.params.id);

    if (!flashcardList) {
      return res.status(404).send("Không tìm thấy danh sách flashcards.");
    }

    const totalFlashcards = flashcards.length;
    const paginatedFlashcards = flashcards.slice(skip, skip + limit);

    res.render("flashcards/flashcard_list_detail", {
      flashcardList: flashcardList,
      flashcards: paginatedFlashcards,
      currentPage: page,
      totalPages: Math.ceil(totalFlashcards / limit),
      totalFlashcards: totalFlashcards,
      limit: limit,
    });
  } catch (err) {
    res.status(500).send("Có lỗi xảy ra: " + err.message);
  }
});

router.post('/flashcardlist/:id', upload.single('image'), async (req, res) => {
  try {
      const { word, meaning, pos, pronunciation, exampleSentence } = req.body;
      const image = req.file ? req.file.buffer.toString('base64') : null;

      const newFlashcard = await flashcardsService.insertFlashcard({
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

router.delete("/delete-flashcard/:id", async (req, res) => {
  try {
    await flashcardsService.deleteFlashcard(req.params.id);
    res.status(200).json({ success: true, message: "Flashcard đã bị xóa" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Xóa thất bại", error: err.message });
  }
});

router.put("/update-flashcard/:id", upload.single("image"), async (req, res) => {
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
      const existingFlashcard = await flashcardsService.getFlashcardListById(req.params.id);
      if (existingFlashcard && existingFlashcard.image) {
        updatedData.image = existingFlashcard.image;
      }
    }

    const updatedFlashcard = await flashcardsService.updateFlashcard(req.params.id, updatedData);

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


router.get("/flashcardlist/:listId/review", async (req, res) => {
  try {
    const { flashcards, flashcardList } = await flashcardsService.getFlashcardListById(req.params.listId);

    if (!flashcards || flashcards.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có flashcard nào trong danh sách này.",
      });
    }

    res.render("flashcards/flashcard_review", {
      flashcards: flashcards,
      flashcardList: flashcardList,
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
