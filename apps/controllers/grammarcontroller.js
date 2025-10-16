const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const verifyToken = require("./../util/VerifyToken");
const { GrammarService, UserprogressService } = require("../services");
const grammarService = new GrammarService();
const userprogressService = new UserprogressService();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, grammarService.imageFolder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const newName = grammarService.getNextImageFilename(ext);
    cb(null, newName);
  },
});

const upload = multer({ storage: storage });

router.get("/api/grammar-list", verifyToken, async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = 3;
  try {
    const { grammars, totalGrammars } = await grammarService.getGrammarList(page, limit);
    const totalPages = Math.ceil(totalGrammars / limit);
    res.json({
      grammars,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching grammars", error: err });
  }
});

router.get("/api/grammar/:id", verifyToken, async function (req, res) {
  try {
    const userId = req.user.id;
    const grammarId = req.params.id;
    const grammar = await grammarService.getGrammar(grammarId);
    if (!grammar) {
      return res.status(404).json({ message: "Grammar not found" });
    }
    let userProgress = await userprogressService.getUserProgressByUserId(userId);
    if (!userProgress) {
      const firstPage = await grammarService.getGrammarList(1, 1);
      const firstGrammar = (firstPage && firstPage.grammars && firstPage.grammars[0]) ? firstPage.grammars[0] : null;
      userProgress = await userprogressService.createUserProgress(userId, null, null, firstGrammar ? firstGrammar._id : null, null);
    }
    const isUnlocked = (userProgress.unlockedGrammars || []).some(s => s.toString() == grammarId.toString());
    if (!isUnlocked) {
      return res.status(403).json({ success: false, message: "This grammar is locked for you. Please complete previous grammars first." });
    }
    res.json({ grammar, userProgress });
  } catch (err) {
    res.status(500).json({ message: "Error fetching grammar details", error: err });
  }
});

router.post("/api/grammar/complete/:id", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const grammarId = req.params.id;
    const grammar = await grammarService.getGrammar(grammarId);
    if (!grammar) {
      return res.status(404).json({ success: false, message: "Grammar not found" });
    }
    let userProgress = await userprogressService.getUserProgressByUserId(userId);
    if (!userProgress) {
      const firstPage = await grammarService.getGrammarList(1, 1);
      const firstGrammar = (firstPage?.grammars?.[0]) || null;
      userProgress = await userprogressService.createUserProgress(userId, null, null, firstGrammar?._id || null, null);
    }
    const isUnlocked = (userProgress.unlockedGrammars || []).some(s => s.toString() == grammarId.toString());
    if (!isUnlocked) {
      return res.status(403).json({ success: false, message: "You cannot complete a locked grammar." });
    }
    const all = await grammarService.getGrammarList(1, 10000);
    const allGrammars = all?.grammars || [];
    const idx = allGrammars.findIndex(s => s._id.toString() == grammarId.toString());
    let nextGrammar = null;
    if (idx !== -1 && idx < allGrammars.length - 1) {
      nextGrammar = allGrammars[idx + 1];
    }
    if (nextGrammar) {
      userProgress = await userprogressService.unlockNextGrammar(userProgress, nextGrammar._id, 10);
    } else {
      userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
    }
    await userprogressService.updateUserProgress(userProgress);
    const updatedUserProgress = await userprogressService.getUserProgressByUserId(userId);
    return res.json({
      success: true,
      message: nextGrammar ? "Grammar completed. Next grammar unlocked." : "Grammar completed. You have finished all grammars.",
      userProgress: {
        unlockedGrammars: updatedUserProgress.unlockedGrammars,
        experiencePoints: updatedUserProgress.experiencePoints,
        streak: updatedUserProgress.streak,
        maxStreak: updatedUserProgress.maxStreak,
        studyDates: updatedUserProgress.studyDates
      }
    });
  } catch (error) {
    console.error("Error completing grammar:", error);
    res.status(500).json({ success: false, message: "Error processing completion", error: error.message });
  }
});

router.post("/api/add", upload.single("image"), async function (req, res) {
  try {
    let quizzes = [];
    if (req.body.quizzes) {
      try {
        quizzes = JSON.parse(req.body.quizzes);
      } catch (e) {
        console.error("Parse quizzes error:", e);
      }
    }
    const grammar = {
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
      images: req.file ? `/static/images/grammar/${req.file.filename}` : null,
      quizzes: quizzes
    };
    const result = await grammarService.insertGrammar(grammar);
    res.status(201).json({ message: "Bài học ngữ pháp đã được thêm thành công !", result });
  } catch (error) {
    res.status(500).json({ message: "Error adding grammar", error });
  }
});

router.get("/api/:id", async function (req, res) {
  try {
    const grammar = await grammarService.getGrammar(req.params.id);
    if (!grammar) {
      return res.status(404).json({ message: "Grammar not found" });
    }
    res.json(grammar);
  } catch (err) {
    console.error("Error fetching grammar:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/api/update/:id", upload.single("image"), async function (req, res) {
  try {
    let quizzes = [];
    if (req.body.quizzes) {
      try {
        quizzes = JSON.parse(req.body.quizzes);
      } catch (e) {
        console.error("Parse quizzes error:", e);
      }
    }
    const existingGrammar = await grammarService.getGrammar(req.params.id);
    if (!existingGrammar) {
      return res.status(404).json({ message: "Bài học ngữ pháp không tìm thấy." });
    }
    let imagePath = existingGrammar.images || "";
    if (req.file) {
      if (existingGrammar.images) {
        const oldFilename = path.basename(existingGrammar.images);
        const oldFilePath = path.join(grammarService.imageFolder, oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
        const ext = path.extname(req.file.originalname);
        const newFilePath = path.join(grammarService.imageFolder, oldFilename);
        fs.renameSync(req.file.path, newFilePath);
        imagePath = `/static/images/grammar/${oldFilename}`;
      } else {
        imagePath = `/static/images/grammar/${req.file.filename}`;
      }
    }
    const grammar = {
      title: req.body.title,
      description: req.body.description,
      content: req.body.content,
      quizzes: quizzes,
      images: imagePath,
    };
    const result = await grammarService.updateGrammar(req.params.id, grammar);
    res.json({ message: "Bài học ngữ pháp đã được cập nhật thành công !", result });
  } catch (error) {
    console.error("Update grammar error:", error);
    res.status(500).json({ message: "Error updating grammar", error });
  }
});

router.delete("/api/grammar/:id", async function (req, res) {
  try {
    const grammar = await grammarService.getGrammar(req.params.id);
    if (!grammar) {
      return res.status(404).json({ message: "Bài học ngữ pháp không tìm thấy." });
    }
    if (grammar.images) {
      const filePath = path.join(grammarService.imageFolder, path.basename(grammar.images));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    const result = await grammarService.deleteGrammar(req.params.id);
    if (result.deletedCount == 0) {
      return res.status(404).json({ message: "Bài học ngữ pháp không tìm thấy." });
    }
    res.json({ message: "Bài học ngữ pháp đã xóa thành công !" });
  } catch (error) {
    console.error("Delete grammar error:", error);
    res.status(500).json({ message: "Error deleting grammar", error: error.message });
  }
});

module.exports = router;