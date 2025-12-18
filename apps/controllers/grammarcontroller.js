const express = require("express");
const router = express.Router();
const multer = require("multer");
const verifyToken = require("./../util/VerifyToken");
const { GrammarService, UserprogressService } = require("../services");
const { cacheMiddleware } = require('./../util/cacheMiddleware');
const grammarService = new GrammarService();
const userprogressService = new UserprogressService();
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/api/grammar-list", verifyToken, cacheMiddleware(300), async function (req, res) {
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  try {
    const role = req.user.role || "user";
    const { grammars, totalGrammars } = await grammarService.getGrammarList(page, limit, "", role);
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

router.get("/api/grammar/slug/:slug", verifyToken, cacheMiddleware(300), async function(req, res) {
  try {
    const slug = req.params.slug;
    const grammar = await grammarService.getGrammarBySlug(slug);
    if (!grammar) {
      return res.status(404).json({ message: "Grammar not found" });
    }
    res.json({ grammar });
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
      category: req.body.category,
      level: req.body.level,
      content: req.body.content,
      images: req.body.images || null,
      quizzes: quizzes,
      slug: req.body.slug,
      sort: parseInt(req.body.sort) || 0,
      display: req.body.display !== undefined ? req.body.display == "true" : true
    };
    const result = await grammarService.insertGrammar(grammar, req.file || null);
    res.status(201).json({ message: "Bài học ngữ pháp đã được thêm thành công !", result });
  } catch (error) {
    console.error("Add grammar error:", error);
    res.status(500).json({ message: "Error adding grammar", error });
  }
});

router.get("/api/:id", cacheMiddleware(600), async function (req, res) {
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
    const grammar = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      level: req.body.level,
      content: req.body.content,
      quizzes: quizzes,
      images: existingGrammar.images || req.body.images || "",
      slug: req.body.slug,
      sort: parseInt(req.body.sort) || 0,
      display: req.body.display !== undefined ? req.body.display == "true" : true
    };
    const result = await grammarService.updateGrammar(req.params.id, grammar, req.file || null);
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
    const result = await grammarService.deleteGrammar(req.params.id);
    res.json({ message: "Bài học ngữ pháp đã xóa thành công !" });
  } catch (error) {
    console.error("Delete grammar error:", error);
    res.status(500).json({ message: "Error deleting grammar", error: error.message });
  }
});

module.exports = router;