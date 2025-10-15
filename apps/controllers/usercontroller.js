const express = require("express");
const router = express.Router();
const { getGoogleAuthURL } = require("./../util/googleAuth");
const verifyToken = require("./../util/VerifyToken");
const { UserService, UserprogressService } = require("../services");
const userService = new UserService();
const userprogressService = new UserprogressService();

router.post("/api/register", async (req, res) => {
  try {
    const { username, email, password, confirmPassword, role } = req.body;
    const result = await userService.register(username, email, password, confirmPassword, role);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await userService.login(email, password);
    res.json(result);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
});

router.get("/auth/google", (req, res) => {
  res.redirect(getGoogleAuthURL());
});

router.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("Lỗi: Không nhận được mã xác thực");
  try {
    const { token, role } = await userService.loginWithGoogle(code);
    const redirectUrl = `http://localhost:5173/login?token=${token}&role=${role}`;
    res.redirect(redirectUrl);
  } catch (error) {
    res.redirect(`http://localhost:5173/login?error=${encodeURIComponent(error.message)}`);
  }
});

router.post("/change-password", verifyToken, async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  try {
    const result = await userService.changePassword(req.user.id, currentPassword, newPassword, confirmNewPassword);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const result = await userService.sendForgotPasswordCode(email);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/verify-code", (req, res) => {
  try {
    const { email, code } = req.body;
    const result = userService.verifyForgotPasswordCode(email, code);
    res.json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const result = await userService.resetPassword(email, newPassword);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/profile/data", verifyToken, async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng !" });
    const userProgress = await userprogressService.getUserProgressByUserId(req.user.id);
    if (!userProgress)
      return res.status(404).json({ message: "User progress not found" });
    res.json({
      success: true,
      user,
      achievements: {
        unlockedGates: userProgress.unlockedGates.length,
        unlockedStages: userProgress.unlockedStages.length,
        experiencePoints: userProgress.experiencePoints,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile data", error });
  }
});

router.post("/profile/update", verifyToken, async (req, res) => {
  try {
    const { username, email } = req.body;
    const result = await userService.updateProfile(req.user.id, username, email);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;