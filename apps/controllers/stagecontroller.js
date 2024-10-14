const express = require("express");
const router = express.Router();
const Stage = require("../models/stage");

// Route to display stage details
router.get("/stage/detail/:id", async (req, res) => {
    try {
        // Find the stage by ID and populate the gate it belongs to
        const stage = await Stage.findById(req.params.id)
            .populate("gate");  // Assuming gate is a reference
        if (!stage) {
            return res.status(404).send("Chặng không tồn tại.");
        }
        // Render the stage detail page
        res.render("stages/stage-detail", { stage });
    } catch (err) {
        res.status(500).send("Đã xảy ra lỗi khi tải chi tiết chặng.");
    }
});

module.exports = router;
