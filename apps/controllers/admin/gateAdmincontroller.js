const express = require("express");
const router = express.Router();
const Gate = require("../../models/gate");
const Journey = require('../../models/journey');

// Route để hiển thị danh sách Gate và Journey
router.get('/', async (req, res) => {
    try {
        const journeys = await Journey.find();  // Lấy danh sách tất cả các Journey
        const gates = await Gate.find().populate('journey'); // Lấy danh sách tất cả các Gate và liên kết với Journey

        res.render('gates/gate', { journeys, gates }); // Truyền danh sách Journey và Gate vào view
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

// Thêm Gate mới
router.post('/add', async (req, res) => {
    const { name, journeyId, isLocked } = req.body;

    try {
        // Kiểm tra xem Journey có tồn tại không
        const journey = await Journey.findById(journeyId);
        if (!journey) {
            return res.status(404).json({ error: 'Journey not found' });
        }

        // Tạo Gate mới với stages rỗng (mặc định)
        const newGate = new Gate({
            title: name,
            journey: journeyId,
            isLocked: isLocked === "true", // Chuyển đổi giá trị từ chuỗi sang Boolean
            stages: [],  // stages mặc định là mảng rỗng
            createdAt: new Date()
        });

        await newGate.save();
        
        // Thêm gate vào journey và lưu lại
        journey.gates.push(newGate._id);
        await journey.save();

        // Trả về thông báo thành công và gate mới
        return res.status(200).json({ message: 'Gate added successfully!', gate: newGate });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to add Gate' });
    }
});

// Sửa Gate
router.post('/update/:id', async (req, res) => {
    const { name, journeyId, isLocked } = req.body;

    try {
        // Tìm Gate theo ID
        const gate = await Gate.findById(req.params.id);
        if (!gate) {
            return res.status(404).json({ error: 'Gate not found' });
        }

        // Kiểm tra Journey mới có tồn tại không
        const newJourney = await Journey.findById(journeyId);
        if (!newJourney) {
            return res.status(404).json({ error: 'New Journey not found' });
        }

        // Nếu journey thay đổi, cập nhật lại danh sách gates của các journey cũ và mới
        if (gate.journey.toString() !== journeyId) {
            const oldJourney = await Journey.findById(gate.journey);
            if (oldJourney) {
                oldJourney.gates.pull(gate._id);
                await oldJourney.save();
            }

            // Thêm gate vào journey mới
            newJourney.gates.push(gate._id);
            await newJourney.save();
        }

        // Cập nhật thông tin Gate
        gate.title = name;
        gate.journey = journeyId;
        gate.isLocked = isLocked; // Lưu giá trị isLocked
        await gate.save();

        return res.status(200).json({ message: 'Gate updated successfully!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to update Gate' });
    }
});


// Xóa Gate
router.post('/delete/:id', async (req, res) => {
    try {
        const gate = await Gate.findById(req.params.id);
        if (!gate) {
            return res.status(404).json({ error: 'Gate not found' });
        }

        const journey = await Journey.findById(gate.journey);
        if (!journey) {
            return res.status(404).json({ error: 'Journey not found' });
        }

        // Xóa gate khỏi danh sách gates của journey
        journey.gates.pull(gate._id);
        await journey.save();

        // Xóa gate từ collection
        await Gate.findByIdAndDelete(gate._id);

        return res.status(200).json({ message: 'Gate deleted successfully!' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to delete Gate' });
    }
});

module.exports = router;
