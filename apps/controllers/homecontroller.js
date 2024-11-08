const express = require('express');
const router = express.Router();

// Định nghĩa các route cho homecontroller
router.get('/', (req, res) => {
    res.render('home'); // Render trang home
});

// Đảm bảo xuất ra router
module.exports = router;
