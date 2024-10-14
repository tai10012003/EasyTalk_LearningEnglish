const express = require("express");
const router = express.Router();
const Journey = require("../models/journey");

// Hiển thị danh sách Journey
router.get("/", async (req, res) => {
    try {
        const journeys = await Journey.find();
        res.render("journeys/journey-list", { journeys });
    } catch (err) {
        res.status(500).send("Đã xảy ra lỗi khi tải danh sách hành trình.");
    }
});

// Controller hiển thị chi tiết hành trình
router.get("/journey/detail/:id", async (req, res) => {
    try {
        const journey = await Journey.findById(req.params.id)
            .populate({
                path: 'gates',
                options: { sort: { sortOrder: 1 } }, // Sort by sortOrder field
                populate: {
                    path: 'stages'
                }
            });
        if (!journey) {
            return res.status(404).send("Hành trình không tồn tại.");
        }
        res.render("gates/gate-list", { journey });
    } catch (err) {
        res.status(500).send("Đã xảy ra lỗi khi tải chi tiết hành trình.");
    }
});



module.exports = router;
