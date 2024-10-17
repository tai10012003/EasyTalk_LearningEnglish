const express = require("express");
const router = express.Router();
const Stage = require("../../models/stage");
const Gate = require("../../models/gate");

// Route để hiển thị danh sách các Stage
router.get("/", async (req, res) => {
    try {
        // Lấy danh sách các Stage cùng với thông tin Gate liên kết
        const stages = await Stage.find().populate("gate");
        res.render("stages/stage", { stages });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching stages.");
    }
});

// Route để hiển thị trang thêm Stage mới
router.get("/add", async (req, res) => {
    try {
        // Lấy danh sách các Gate để chọn khi tạo Stage mới
        const gates = await Gate.find();
        res.render("stages/addstage", { gates });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching gates.");
    }
});

// Route để thêm một Stage mới
router.post("/add", async (req, res) => {
    const { title, gateId, isLocked, questions } = req.body;

    // Kiểm tra xem gate có tồn tại không
    try {
        const gate = await Gate.findById(gateId);
        if (!gate) {
            return res.status(404).send("Gate not found.");
        }

        // Tạo Stage mới
        const newStage = new Stage({
            title,
            gate: gateId,
            isLocked: isLocked,
            questions: questions.map(question => ({
                question: question.question,
                type: question.type,
                options: question.options || [],
                correctAnswer: question.correctAnswer,
                explanation: question.explanation
            }))
        });

        await newStage.save();

        // Thêm stage vào gate tương ứng
        gate.stages.push(newStage._id);
        await gate.save();

        res.redirect("/admin/stage");
    } catch (err) {
        console.error(err);
        res.status(400).send("Error saving new stage: " + err.message);
    }
});

// Route để hiển thị trang cập nhật một Stage
router.get("/update/:id", async (req, res) => {
    try {
        const stage = await Stage.findById(req.params.id).populate("gate");
        const gates = await Gate.find(); // Lấy danh sách các Gate để lựa chọn
        if (!stage) {
            return res.status(404).send("Stage not found.");
        }
        res.render("stages/updatestage", { stage, gates });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching stage.");
    }
});

router.post("/update/:id", async (req, res) => {
    try {
        const stageId = req.params.id;
        const { title, gateId, isLocked, questions } = req.body; // Lấy dữ liệu từ req.body

        // Kiểm tra xem stage có tồn tại không
        const stage = await Stage.findById(stageId);
        if (!stage) {
            return res.status(404).send("Chặng không tồn tại.");
        }

        // Cập nhật dữ liệu cho stage
        stage.title = title;
        stage.gate = gateId;
        stage.isLocked = isLocked === "true"; // Chuyển đổi giá trị từ chuỗi sang Boolean
        stage.questions = questions;

        await stage.save();

        res.redirect("/admin/stage");
    } catch (err) {
        console.error("Error updating stage:", err);
        res.status(500).send("Đã xảy ra lỗi khi cập nhật chặng.");
    }
});


// Route để xóa một Stage
router.post("/delete/:id", async (req, res) => {
    try {
        const stage = await Stage.findByIdAndDelete(req.params.id);

        if (!stage) {
            return res.status(404).send("Stage not found.");
        }

        // Xóa stage khỏi danh sách stages của gate tương ứng
        const gate = await Gate.findById(stage.gate);
        if (gate) {
            gate.stages.pull(stage._id);
            await gate.save();
        }

        res.redirect("/admin/stage");
    } catch (err) {
        console.error(err);
        res.status(400).send("Error deleting stage.");
    }
});

module.exports = router;
