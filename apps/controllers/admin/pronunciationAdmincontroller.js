var express = require("express");
const { ObjectId } = require("mongodb");
var router = express.Router();
var Pronunciation = require("./../../models/pronunciation");
var PronunciationService = require("./../../services/pronunciationService");
const multer = require("multer");

// Set up Multer storage
const storage = multer.memoryStorage(); // Store file in memory as a Buffer
const upload = multer({ storage: storage });

// Route để hiển thị trang chủ
router.get("/", function (req, res) {
    res.render("pronunciations/pronunciation"); 
});

router.get("/add", function (req, res) {
  res.render("pronunciations/addpronunciation");
});

router.get("/update", async function (req, res) {
    const pronunciationService = new PronunciationService();
    const pronunciation = await pronunciationService.getPronunciation(req.query.id);
    res.render("pronunciations/updatepronunciation", { pronunciation });
  });

router.get("/api/pronunciation-list", async function (req, res) {
  const pronunciationService = new PronunciationService();
  const page = parseInt(req.query.page) || 1;
  const limit = 3;

  const { pronunciations, totalPronunciations } = await pronunciationService.getPronunciationList(page, limit);
  const totalPages = Math.ceil(totalPronunciations / limit);

  res.json({
    pronunciations,
    currentPage: page,
    totalPages,
  });
});


router.post("/api/add", upload.single("image"), async function (req, res) {
    const pronunciationService = new PronunciationService();

    try {
        const pronunciation = {
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
            images: req.file ? req.file.buffer : null  // Lưu hình ảnh dưới dạng buffer nếu có
        };

        const result = await pronunciationService.insertPronunciation(pronunciation);
        res.status(201).json({ message: "Pronunciation added successfully", result });
    } catch (error) {
        res.status(500).json({ message: "Error adding Pronunciation", error });
    }
});

// API để cập nhật thông tin bài ngữ pháp
router.put("/api/update/:id", upload.single("image"), async function (req, res) {
    const pronunciationService = new PronunciationService();  // Đảm bảo import đúng service
    try {
      // Tạo đối tượng grammar từ request body
      const pronunciation = {
        _id: new ObjectId(req.params.id),
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
      };

      // Nếu có file ảnh được upload thì thêm vào đối tượng grammar
      if (req.file) {
        pronunciation.images = req.file.buffer;  // Lưu ảnh dưới dạng buffer
      } else {
        // Nếu không có ảnh mới, lấy ảnh hiện tại từ database
        const existingPronunciation = await pronunciationService.getPronunciation(req.params.id);
        if (!existingPronunciation) {
          return res.status(404).json({ message: "Pronunciation not found" });
        }
        pronunciation.images = existingPronunciation.images;  // Giữ ảnh hiện tại nếu không có ảnh mới
      }

      // Gọi service để cập nhật bài ngữ pháp
      const result = await pronunciationService.updatePronunciation(pronunciation);
      res.json({ message: "Pronunciation updated successfully", result });
    } catch (error) {
      res.status(500).json({ message: "Error updating pronunciation", error });
    }
  }
);



// API để xóa bài ngữ pháp
router.delete("/api/pronunciation/:id", async function (req, res) {
    const pronunciationService = new PronunciationService();
    const result = await pronunciationService.deletePronunciation(req.params.id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Pronunciation not found" });
    }
  
    res.json({ message: "Pronunciation deleted successfully" });
  });
  

module.exports = router;
