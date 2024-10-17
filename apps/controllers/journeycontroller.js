const express = require("express");
const router = express.Router();
const Journey = require("../models/journey");
const User = require("../models/user");
const UserProgress = require("../models/userprogress");

// Hiển thị danh sách Journey
router.get("/", async (req, res) => {
    try {
        const userId = req.user._id;

        // Lấy danh sách các Journey
        const journeys = await Journey.find()
            .populate({
                path: 'gates',
                populate: {
                    path: 'stages'
                }
            });

        // Tính tổng số chặng và cổng từ dữ liệu Journey
        let totalStages = 0;
        let totalGates = 0;
        journeys.forEach(journey => {
            journey.gates.forEach(gate => {
                totalGates++;
                totalStages += gate.stages.length;
            });
        });

        // Lấy thông tin tiến trình của người dùng
        const userProgress = await UserProgress.findOne({ user: userId })
            .populate('unlockedGates')
            .populate('unlockedStages');

        // Nếu không có tiến trình, thiết lập giá trị mặc định
        const unlockedGates = userProgress ? userProgress.unlockedGates : [];
        const unlockedStages = userProgress ? userProgress.unlockedStages : [];

        // Tính số cổng và chặng đã hoàn thành
        const completedGates = unlockedGates.length;
        const completedStages = unlockedStages.length;

        res.render("journeys/journey-list", {
            journeys,
            userProgress,
            totalStages,
            totalGates,
            completedGates,
            completedStages
        });
    } catch (err) {
        console.error("Lỗi khi tải danh sách hành trình:", err);
        res.status(500).send("Đã xảy ra lỗi khi tải danh sách hành trình.");
    }
});

// Hiển thị chi tiết hành trình
router.get("/journey/detail/:id", async (req, res) => {
    try {
        const journeyId = req.params.id;
        const userId = req.user._id;

        // Tìm hành trình theo ID
        const journey = await Journey.findById(journeyId)
            .populate({
                path: 'gates',
                populate: {
                    path: 'stages'
                }
            });

        if (!journey) {
            return res.status(404).send("Hành trình không tồn tại.");
        }

        // Lấy thông tin tiến trình của người dùng
        let userProgress = await UserProgress.findOne({ user: userId });
        if (!userProgress) {
            // Nếu người dùng chưa có tiến trình, tạo một bản ghi mới
            userProgress = new UserProgress({ user: userId, unlockedGates: [], unlockedStages: [] });

            // Mở khóa cổng đầu tiên và chặng đầu tiên
            if (journey.gates.length > 0) {
                const firstGate = journey.gates[0];
                userProgress.unlockedGates.push(firstGate._id); // Mở khóa cổng đầu tiên

                if (firstGate.stages.length > 0) {
                    const firstStage = firstGate.stages[0];
                    userProgress.unlockedStages.push(firstStage._id); // Mở khóa chặng đầu tiên
                }
            }

            // Lưu tiến trình mới
            await userProgress.save();
        } else {
            // Nếu đã có UserProgress, kiểm tra xem cổng và chặng đầu tiên đã được mở khóa chưa
            if (journey.gates.length > 0) {
                const firstGate = journey.gates[0];
                if (!userProgress.unlockedGates.includes(firstGate._id.toString())) {
                    userProgress.unlockedGates.push(firstGate._id); // Mở khóa cổng đầu tiên
                }

                if (firstGate.stages.length > 0) {
                    const firstStage = firstGate.stages[0];
                    if (!userProgress.unlockedStages.includes(firstStage._id.toString())) {
                        userProgress.unlockedStages.push(firstStage._id); // Mở khóa chặng đầu tiên
                    }
                }

                // Lưu cập nhật tiến trình nếu có thay đổi
                await userProgress.save();
            }
        }
        // Lấy thông tin tiến trình của người dùng
        const userprogress = await UserProgress.findOne({ user: userId })
            .populate('unlockedGates')
            .populate('unlockedStages');

        // Nếu không có tiến trình, thiết lập giá trị mặc định
        const unlockedGates = userprogress ? userprogress.unlockedGates : [];
        const unlockedStages = userprogress ? userprogress.unlockedStages : [];

        // Tính số cổng và chặng đã hoàn thành
        const completedGates = unlockedGates.length;
        const completedStages = unlockedStages.length;

        // Truyền journey và userProgress vào template
        res.render("gates/gate-list", { journey, userProgress, userprogress, completedGates, completedStages });
    } catch (err) {
        res.status(500).send("Đã xảy ra lỗi khi tải chi tiết hành trình.");
    }
});



module.exports = router;