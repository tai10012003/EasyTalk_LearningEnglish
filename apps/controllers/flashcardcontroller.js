var express = require("express");
var router = express.Router();
const Flashcard = require("../models/flashcard");
const FlashcardList = require("../models/flashcard_list");

var multer = require("multer");
var path = require("path");

//lấy toàn bộ các flashcardlist
router.get("/", async (req, res) => {
  const perPage = 12; // Số lượng flashcards mỗi trang
  const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là 1

  try {
    // Đếm tổng số flashcard lists
    const totalItems = await FlashcardList.countDocuments();

    // Lấy danh sách flashcards theo phân trang
    const flashcardlists = await FlashcardList.find()
      .skip(perPage * page - perPage)
      .limit(perPage);

    // Tính tổng số trang
    const totalPages = Math.ceil(totalItems / perPage);

    // Render trang EJS và truyền dữ liệu flashcardlists, trang hiện tại, và tổng số trang
    res.render("flashcards/flashcards", {
      flashcardlists,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    res.status(500).send(err);
  }
});

//tạo một flashcardlist
router.post("/create", async (req, res) => {
  try {
    const { name, description } = req.body;
    const newFlashcardList = new FlashcardList({
      name,
      description,
    });

    // Lưu flashcard list vào database
    await newFlashcardList.save();

    // Phản hồi thành công
    res.status(201).json({ success: true, flashcardList: newFlashcardList });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi tạo FlashcardList" });
  }
});

//xoá một flashcardlist
router.delete("/:id", (req, res) => {
  FlashcardList.findByIdAndDelete(req.params.id)
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => res.status(500).send(err));
});

// Route để cập nhật một list từ (cần thêm phần chỉnh sửa .ejs để xử lý)
router.put("/flashcardlist/:id", async (req, res) => {
  try {
    const { name, description } = req.body; // Lấy dữ liệu từ client gửi lên

    // Tìm và cập nhật FlashcardList theo id
    const updatedFlashcardList = await FlashcardList.findByIdAndUpdate(
      req.params.id, // ID của FlashcardList cần cập nhật
      { name, description }, // Dữ liệu cập nhật
      { new: true, runValidators: true } // Tùy chọn trả về bản ghi đã cập nhật
    );

    if (!updatedFlashcardList) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy danh sách" });
    }

    // Phản hồi thành công
    res
      .status(200)
      .json({ success: true, flashcardList: updatedFlashcardList });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Cập nhật thất bại",
      error: err.message,
    });
  }
});

module.exports = router;

// Route để hiển thị danh sách flashcards thuộc về một flashcardlist
router.get("/flashcardlist/:id", async (req, res) => {
  try {
    // Lấy danh sách flashcardlist dựa vào ID
    const flashcardList = await FlashcardList.findById(req.params.id);

    // Lấy tất cả flashcards thuộc về flashcardlist này
    const flashcards = await Flashcard.find({ flashcardList: req.params.id });

    // Render trang EJS và truyền dữ liệu flashcardlist và flashcards vào
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
    const { word, meaning, pos, pronunciation, exampleSentence, image, audio } =
      req.body;

    const newFlashcard = new Flashcard({
      word,
      meaning,
      pos,
      pronunciation,
      exampleSentence,
      image,
      audio,
      flashcardList: req.params.id, // Lấy id của FlashcardList
    });

    // Lưu flashcard mới vào database
    await newFlashcard.save();

    // Phản hồi thành công
    res.status(201).json({ success: true, flashcard: newFlashcard });
  } catch (err) {
    res.status(500).send("Có lỗi xảy ra: " + err.message);
  }
});

router.delete("/delete-flashcard/:id", async (req, res) => {
  try {
    const flashcardId = req.params.id;
    const flashcard = await Flashcard.findByIdAndDelete(flashcardId);

    if (!flashcard) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy flashcard" });
    }

    // Phản hồi thành công
    res.status(200).json({ success: true, message: "Flashcard đã bị xóa" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Xóa flashcard thất bại",
      error: err.message,
    });
  }
});

router.put("/update-flashcard/:id", async (req, res) => {
  const flashcardId = req.params.id;
  const { word, meaning, pos, pronunciation, exampleSentence, image, audio } =
    req.body;

  try {
    const updatedFlashcard = await Flashcard.findByIdAndUpdate(
      flashcardId,
      {
        word,
        meaning,
        pos,
        pronunciation,
        exampleSentence,
        image,
        audio,
      },
      { new: true }
    );

    if (!updatedFlashcard) {
      return res.status(404).json({ message: "Flashcard không tồn tại" });
    }

    res.json({
      success: true,
      message: "Flashcard đã được cập nhật",
      updatedFlashcard,
    });
  } catch (error) {
    console.error("Error updating flashcard:", error);
    res.status(500).json({ message: "Đã xảy ra lỗi khi cập nhật flashcard" });
  }
});

router.get("/flashcardlist/:listId/review", async (req, res) => {
  try {
    // Tìm tất cả flashcard trong FlashcardList bằng listId
    const flashcards = await Flashcard.find({
      flashcardList: req.params.listId,
    });
    const flashcardList = await FlashcardList.findById(req.params.listId);
    if (!flashcards || flashcards.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có flashcard nào trong danh sách này.",
      });
    }

    // Render trang flashcard_review.ejs và truyền flashcards cho giao diện
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
