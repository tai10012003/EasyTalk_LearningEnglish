var express = require("express");
var router = express.Router();
var DictationService = require("./../../services/dictationService");

router.get("/", function (req, res) {
    res.render("dictationexercises/dictationexercise");
});

router.get("/add", function (req, res) {
    res.render("dictationexercises/adddictationexercise");
});

router.get("/update", async function (req, res) {
    try {
        const dictationService = new DictationService();
        const dictation = await dictationService.getDictation(req.query.id);

        if (!dictation) {
            return res.status(404).send("Bài nghe chép chính tả không tồn tại.");
        }
        res.render("dictationexercises/updatedictationexercise", { dictation });
    } catch (error) {
        console.error("Error fetching dictation:", error);
        res.status(500).send("Đã xảy ra lỗi khi tải bài nghe chép chính tả.");
    }
});


router.get("/api/dictation-list", async function (req, res) {
    const dictationService = new DictationService();
    const page = parseInt(req.query.page) || 1;
    const limit = 6;

    const { dictationExercises, totalDictationExercises } = await dictationService.getDictationList(page, limit);
    const totalPages = Math.ceil(totalDictationExercises / limit);

    res.json({
        dictationExercises,
        currentPage: page,
        totalPages,
    });
});

router.post("/api/add", async function (req, res) {
    const dictationService = new DictationService();
    try {
        const dictationexercises = {
            title: req.body.title,
            content: req.body.content,
        };
        const result = await dictationService.insertDictation(dictationexercises);
        res.status(201).json({ message: "Bài nghe chép chính tả đã được thêm thành công!", result });
    } catch (error) {
        res.status(500).json({ message: "Error adding dictation exercise", error });
    }
});

router.put("/api/update/:id", async function (req, res) {
    const dictationService = new DictationService();
    try {
        const dictationexercises = {
            _id: req.params.id,
            title: req.body.title,
            content: req.body.content,
        };
        const result = await dictationService.updateDictation(dictationexercises);
        res.json({ message: "Bài nghe chép chính tả đã được cập nhật thành công!", result });
    } catch (error) {
        res.status(500).json({ message: "Error updating dictation exercise", error });
    }
});

router.delete("/api/dictation/:id", async function (req, res) {
    const dictationService = new DictationService();
    const result = await dictationService.deleteDictation(req.params.id);
    if (result.deletedCount === 0) {
        return res.status(404).json({ message: "Bài nghe chép chính tả không tìm thấy." });
    }
    res.json({ message: "Bài nghe chép chính tả đã xóa thành công!" });
});

module.exports = router;