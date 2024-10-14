var express = require("express");
var router = express.Router();
const { isAuthenticated, isAdmin } = require('../../middlewares/authMiddleware'); // Đảm bảo đường dẫn đúng

// Các route không cần phân quyền
router.use("/home", require(__dirname + "/homecontroller"));
router.use("/about", require(__dirname + "/aboutcontroller"));
router.use("/journey", isAuthenticated, require(__dirname + "/journeycontroller"));
router.use("/grammar", require(__dirname + "/grammarcontroller"));
router.use("/pronunciation", require(__dirname + "/pronunciationcontroller"));
router.use("/grammar-exercise", isAuthenticated, require(__dirname + "/grammarexercisecontroller"));
router.use("/pronunciation-exercise", isAuthenticated, require(__dirname + "/pronunciationexercisecontroller"));
router.use("/blog", require(__dirname + "/blogcontroller"));
router.use("/login", require(__dirname + "/usercontroller"));
router.use("/register", require(__dirname + "/usercontroller"));
router.use("/profile", require(__dirname + "/usercontroller"));
router.use("/profile/update", require(__dirname + "/usercontroller"));
router.use("/flashcards", isAuthenticated, require(__dirname + "/flashcardcontroller"));
router.use("/chat", require(__dirname + "/chatgptcontroller"));
router.use("/dictionary", require(__dirname + "/dictionarycontroller"));
router.use("/contact", require(__dirname + "/contactcontroller"));

// Các route cần phân quyền admin
router.use("/admin", isAdmin, require(__dirname + "/admin/homeAdmincontroller"));
router.use("/admin/journey", isAdmin, require(__dirname + "/admin/journeyAdmincontroller"));
router.use("/admin/gate", isAdmin, require(__dirname + "/admin/gateAdmincontroller"));
router.use("/admin/stage", isAdmin, require(__dirname + "/admin/stageAdmincontroller"));
router.use("/admin/grammar", isAdmin, require(__dirname + "/admin/grammarAdmincontroller"));
router.use("/admin/grammar-exercise",  isAdmin, require(__dirname + "/admin/grammarexerciseAdmincontroller"));
router.use("/admin/pronunciation",  isAdmin, require(__dirname + "/admin/pronunciationAdmincontroller"));
router.use("/admin/pronunciation-exercise", isAdmin, require(__dirname + "/admin/pronunciationexerciseAdmincontroller"));
router.use("/admin/users", isAdmin, require(__dirname + "/admin/userAdmincontroller"));


// Trang admin dashboard
router.get('/admin', isAdmin, (req, res) => {
    res.render('admin/dashboard'); // Chỉ admin mới có thể truy cập vào route này
});

router.get('/', (req, res) => {
    res.render('home'); // Hoặc render file tương ứng
});

router.get("/single-blog", function (req, res) {
    res.render("single-blog.ejs");
});

router.get("/single-blog-1", function (req, res) {
    res.render("single-blog-1.ejs");
});
module.exports = router;
