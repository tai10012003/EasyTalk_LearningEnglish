var express = require("express");
var router = express.Router();
const FlashcardsService = require("./../services/flashcardService");
const flashcardsService = new FlashcardsService();


router.get("/", async (req, res) => {
    res.render("flashcards/flashcards");
});


router.get("/api/flashcard-list", async (req, res) => {
  const perPage = 12;
  const page = parseInt(req.query.page) || 1;

  try {
    const { flashcardLists, totalFlashcardLists } = await flashcardsService.getFlashcardList(page, perPage);

    const totalPages = Math.ceil(totalFlashcardLists / perPage);

    // Trả về JSON
    res.json({
      flashcardLists,  // Danh sách flashcard lists
      totalPages,      // Tổng số trang
      currentPage: page // Trang hiện tại
    });
  } catch (err) {
    res.status(500).json({ message: "Có lỗi xảy ra", error: err.message });
  }
});

router.post("/create", async (req, res) => {
  try {
    const { name, description } = req.body;
    const newFlashcardList = await flashcardsService.insertFlashcardList({ name, description });

    // Phản hồi thành công với JSON
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

// Route để cập nhật một list từ
router.put("/flashcardlist/:id", async (req, res) => {
  try {
    const { name, description } = req.body; // Lấy dữ liệu từ client gửi lên
    const updatedFlashcardList = await flashcardsService.updateFlashcardList(req.params.id, { name, description });

    if (!updatedFlashcardList) {
      return res.status(404).json({ success: false, message: "Không tìm thấy danh sách" });
    }

    // Phản hồi thành công
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
    const { flashcardList, flashcards } = await flashcardsService.getFlashcardListById(req.params.id);
    
    if (!flashcardList) {
      return res.status(404).send("Không tìm thấy danh sách flashcards.");
    }

    res.render("flashcards/flashcard_list_detail", {
      flashcardList: flashcardList,
      flashcards: flashcards,
    });
  } catch (err) {
    res.status(500).send("Có lỗi xảy ra: " + err.message);
  }
});

// Thêm flashcard mới
router.post("/flashcardlist/:id", async (req, res) => {
  try {
    const flashcardData = req.body;
    const newFlashcard = await flashcardsService.insertFlashcard({
      ...flashcardData,
      flashcardList: req.params.id,
    });

    res.status(201).json({ success: true, flashcard: newFlashcard });
  } catch (err) {
    res.status(500).json({ success: false, message: "Có lỗi xảy ra", error: err.message });
  }
});

// Xóa flashcard
router.delete("/delete-flashcard/:id", async (req, res) => {
  try {
    await flashcardsService.deleteFlashcard(req.params.id);
    res.status(200).json({ success: true, message: "Flashcard đã bị xóa" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Xóa thất bại", error: err.message });
  }
});

// Cập nhật flashcard
router.put("/update-flashcard/:id", async (req, res) => {
  try {
    const updatedFlashcard = await flashcardsService.updateFlashcard(req.params.id, req.body);

    if (!updatedFlashcard) {
      return res.status(404).json({ message: "Flashcard không tồn tại" });
    }

    res.json({
      success: true,
      message: "Flashcard đã được cập nhật",
      updatedFlashcard,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Đã xảy ra lỗi khi cập nhật flashcard", error: error.message });
  }
});

// Lấy flashcards cho review
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
