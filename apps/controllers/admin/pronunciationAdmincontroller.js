var express = require("express");
const { ObjectId } = require("mongodb");
var router = express.Router();
var PronunciationService = require("./../../services/pronunciationService");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

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
            images: req.file ? req.file.buffer : null
        };

        const result = await pronunciationService.insertPronunciation(pronunciation);
        res.status(201).json({ message: "Bài học phát âm đã được thêm thành công !", result });
    } catch (error) {
        res.status(500).json({ message: "Error adding Pronunciation", error });
    }
});

router.put("/api/update/:id", upload.single("image"), async function (req, res) {
    const pronunciationService = new PronunciationService();
    try {
      const pronunciation = {
        _id: new ObjectId(req.params.id),
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
      };
      if (req.file) {
        pronunciation.images = req.file.buffer;
      } else {
        const existingPronunciation = await pronunciationService.getPronunciation(req.params.id);
        if (!existingPronunciation) {
          return res.status(404).json({ message: "Bài học phát âm không tìm thấy." });
        }
        pronunciation.images = existingPronunciation.images;
      }
      const result = await pronunciationService.updatePronunciation(pronunciation);
      res.json({ message: "Bài học phát âm đã được cập nhật thành công !", result });
    } catch (error) {
      res.status(500).json({ message: "Error updating pronunciation", error });
    }
  }
);

router.delete("/api/pronunciation/:id", async function (req, res) {
    const pronunciationService = new PronunciationService();
    const result = await pronunciationService.deletePronunciation(req.params.id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Bài học phát âm không tìm thấy." });
    }
  
    res.json({ message: "Bài học phát âm đã xóa thành công !" });
});
  
module.exports = router;
