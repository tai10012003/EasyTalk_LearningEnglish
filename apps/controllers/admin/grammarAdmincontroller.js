var express = require("express");
const { ObjectId } = require("mongodb");
var router = express.Router();
var Grammar = require("./../../models/grammar");
var GrammarService = require("./../../services/grammarService");
const verifyToken = require('./../../util/VerifyToken');
const multer = require("multer");

// Set up Multer storage
const storage = multer.memoryStorage(); // Store file in memory as a Buffer
const upload = multer({ storage: storage });

// Route để hiển thị trang chủ
router.get("/", function (req, res) {
    res.render("grammars/grammar"); // Render trang danh sách bài ngữ pháp
});

// Route hiển thị giao diện tạo bài ngữ pháp mới
router.get("/add", function (req, res) {
  res.render("grammars/addgrammar");
});

// Route hiển thị giao diện cập nhật bài ngữ pháp
router.get("/update", async function (req, res) {
  const grammarService = new GrammarService();
  const grammar = await grammarService.getGrammar(req.query.id);
  res.render("grammars/updategrammar", { grammar });
});

router.get("/api/grammar-list", async function (req, res) {
  const grammarService = new GrammarService();
  const page = parseInt(req.query.page) || 1;
  const limit = 2; // Số lượng bài ngữ pháp trên mỗi trang

  const { grammars, totalGrammars } = await grammarService.getGrammarList(page, limit);
  const totalPages = Math.ceil(totalGrammars / limit);

  res.json({
    grammars,
    currentPage: page,
    totalPages,
  });
});


router.post("/api/add", upload.single("image"), async function (req, res) {
    const grammarService = new GrammarService();

    try {
        // Tạo đối tượng dữ liệu bài ngữ pháp từ request body
        const grammar = {
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
            images: req.file ? req.file.buffer : null  // Lưu hình ảnh dưới dạng buffer nếu có
        };

        // Gọi phương thức insertGrammar trong GrammarService
        const result = await grammarService.insertGrammar(grammar);
        res.status(201).json({ message: "Grammar added successfully", result });
    } catch (error) {
        res.status(500).json({ message: "Error adding grammar", error });
    }
});

// API để cập nhật thông tin bài ngữ pháp
router.put("/api/update/:id", upload.single("image"), async function (req, res) {
    const grammarService = new GrammarService();  // Đảm bảo import đúng service
    try {
      // Tạo đối tượng grammar từ request body
      const grammar = {
        _id: new ObjectId(req.params.id),
        title: req.body.title,
        description: req.body.description,
        content: req.body.content,
      };

      // Nếu có file ảnh được upload thì thêm vào đối tượng grammar
      if (req.file) {
        grammar.images = req.file.buffer;  // Lưu ảnh dưới dạng buffer
      } else {
        // Nếu không có ảnh mới, lấy ảnh hiện tại từ database
        const existingGrammar = await grammarService.getGrammar(req.params.id);
        if (!existingGrammar) {
          return res.status(404).json({ message: "Grammar not found" });
        }
        grammar.images = existingGrammar.images;  // Giữ ảnh hiện tại nếu không có ảnh mới
      }

      // Gọi service để cập nhật bài ngữ pháp
      const result = await grammarService.updateGrammar(grammar);
      res.json({ message: "Grammar updated successfully", result });
    } catch (error) {
      res.status(500).json({ message: "Error updating grammar", error });
    }
  }
);


// API để xóa bài ngữ pháp
router.delete("/api/grammar/:id", async function (req, res) {
    const grammarService = new GrammarService();
    const result = await grammarService.deleteGrammar(req.params.id);
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Grammar not found" });
    }
  
    res.json({ message: "Grammar deleted successfully" });
  });
  

module.exports = router;
