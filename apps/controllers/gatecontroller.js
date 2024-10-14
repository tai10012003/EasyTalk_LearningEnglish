const express = require("express");
const router = express.Router();
const Gate = require("../models/gate");

// Hiển thị danh sách Gate
router.get("/", async (req, res) => {
    try {
        const gates = await Gate.find();
        res.render("gates/gate-list", { gates });
    } catch (err) {
        res.status(500).send(err);
    }
});

// Hiển thị chi tiết Gate
router.get('/gate/detail/:id', async (req, res) => {
    try {
        const gate = await Gate.findById(req.params.id).populate({
            path: 'stages',
            populate: ['lessons', 'exercises']
        });
        res.render('gates/gate-detail', { gate });
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;
