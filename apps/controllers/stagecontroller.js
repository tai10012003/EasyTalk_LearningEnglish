const express = require("express");
const router = express.Router();
const Stage = require("../models/stage");
const Gate = require("../models/gate");
const User = require("../models/user");
const UserProgress = require("../models/userprogress");

// Route để hiển thị chi tiết chặng
router.get("/stage/detail/:id", async (req, res) => {
    try {
        // Tìm chặng theo ID và liên kết với cổng mà nó thuộc về
        const stage = await Stage.findById(req.params.id).populate("gate");
        if (!stage) {
            return res.status(404).send("Chặng không tồn tại.");
        }
        // Render trang chi tiết chặng
        res.render("stages/stage-detail", { stage });
    } catch (err) {
        res.status(500).send("Đã xảy ra lỗi khi tải chi tiết chặng.");
    }
});

// Xử lý hoàn thành chặng
router.post("/stage/complete/:id", async (req, res) => {
    try {
        const stageId = req.params.id;
        const userId = req.user._id;

        // Tìm chặng hiện tại
        const currentStage = await Stage.findById(stageId).populate("gate");
        if (!currentStage) {
            return res.status(404).json({ error: "Không tìm thấy chặng." });
        }

        // Cập nhật UserProgress để đánh dấu chặng đã hoàn thành
        let userProgress = await UserProgress.findOne({ user: userId });
        if (!userProgress) {
            userProgress = new UserProgress({ user: userId, unlockedGates: [], unlockedStages: [] });
        }

        // Nếu chặng chưa được mở khóa, thêm vào danh sách đã mở khóa
        if (!userProgress.unlockedStages.includes(stageId)) {
            userProgress.unlockedStages.push(stageId);
        }

        // Tìm tất cả các chặng trong cổng hiện tại, để xác định chặng kế bên
        const allStagesInGate = await Stage.find({ gate: currentStage.gate._id }).sort({ _id: 1 });
        const currentStageIndex = allStagesInGate.findIndex(stage => stage._id.toString() === stageId);

        // Mở khóa chặng kế bên nếu có
        if (currentStageIndex !== -1 && currentStageIndex < allStagesInGate.length - 1) {
            const nextStage = allStagesInGate[currentStageIndex + 1];
            if (!userProgress.unlockedStages.includes(nextStage._id.toString())) {
                userProgress.unlockedStages.push(nextStage._id);
            }
        } else {
            // Nếu đã hết chặng trong cổng hiện tại, mở khóa cổng kế tiếp nếu có
            const allGatesInJourney = await Gate.find({ journey: currentStage.gate.journey }).sort({ _id: 1 });
            const currentGateIndex = allGatesInJourney.findIndex(gate => gate._id.toString() === currentStage.gate._id.toString());

            if (currentGateIndex !== -1 && currentGateIndex < allGatesInJourney.length - 1) {
                const nextGate = allGatesInJourney[currentGateIndex + 1];
                if (!userProgress.unlockedGates.includes(nextGate._id.toString())) {
                    userProgress.unlockedGates.push(nextGate._id);

                    // Mở khóa chặng đầu tiên của cổng kế bên nếu có
                    const firstStageOfNextGate = await Stage.findOne({ gate: nextGate._id }).sort({ _id: 1 });
                    if (firstStageOfNextGate && !userProgress.unlockedStages.includes(firstStageOfNextGate._id.toString())) {
                        userProgress.unlockedStages.push(firstStageOfNextGate._id);
                    }
                }
            }
        }

        // Lưu cập nhật UserProgress
        await userProgress.save();

        res.json({ message: "Chặng đã hoàn thành và tiến trình đã được cập nhật." });
    } catch (error) {
        res.status(500).json({ error: "Đã xảy ra lỗi khi xử lý tiến trình.", detail: error.message });
    }
});






module.exports = router;
