const express = require("express");
const router = express.Router();
const verifyToken = require("./../util/VerifyToken");
const GrammarService = require("../services/grammarService");
const UserProgressService = require("./../services/userprogressService");
const userProgressService = new UserProgressService();

router.get("/api/grammar-list", verifyToken, async function (req, res) {
  const grammarService = new GrammarService();
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
  const grammarService = new GrammarService();
  try {
    const userId = req.user.id;
    const grammarId = req.params.id;
    const grammar = await grammarService.getGrammar(grammarId);

    if (!grammar) {
      return res.status(404).json({ message: "Grammar not found" });
    }
    let userProgress = await userProgressService.getUserProgressByUserId(userId);
    if (!userProgress) {
      const firstPage = await grammarService.getGrammarList(1, 1);
      const firstGrammar = (firstPage && firstPage.grammars && firstPage.grammars[0]) ? firstPage.grammars[0] : null;
      userProgress = await userProgressService.createUserProgress(userId, null, null, firstGrammar ? firstGrammar._id : null, null);
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
  const grammarService = new GrammarService();
    try {
        const userId = req.user.id;
        const grammarId = req.params.id;

        const grammar = await grammarService.getGrammar(grammarId);
        if (!grammar) {
            return res.status(404).json({ success: false, message: "Grammar not found" });
        }

        let userProgress = await userProgressService.getUserProgressByUserId(userId);
        if (!userProgress) {
            const firstPage = await grammarService.getGrammarList(1, 1);
            const firstGrammar = (firstPage && firstPage.grammars && firstPage.grammars[0]) ? firstPage.grammars[0] : null;
            userProgress = await userProgressService.createUserProgress(userId, null, null, firstGrammar ? firstGrammar._id : null, null);
        }
        const isUnlocked = (userProgress.unlockedGrammars || []).some(s => s.toString() == grammarId.toString());
        if (!isUnlocked) {
            return res.status(403).json({ success: false, message: "You cannot complete a locked grammar." });
        }
        const all = await grammarService.getGrammarList(1, 10000);
        const allGrammars = all && all.grammars ? all.grammars : [];

        const idx = allGrammars.findIndex(s => s._id.toString() == grammarId.toString());
        let nextGrammar = null;
        if (idx !== -1 && idx < allGrammars.length - 1) {
            nextGrammar = allGrammars[idx + 1];
        }

        if (nextGrammar) {
            userProgress = await userProgressService.unlockNextGrammar(userProgress, nextGrammar._id, 10);
            return res.json({
                success: true,
                message: "Grammar completed. Next grammar unlocked.",
                unlockedGrammars: userProgress.unlockedGrammars
            });
        } else {
            userProgress.experiencePoints = (userProgress.experiencePoints || 0) + 10;
            await userProgressService.updateUserProgress(userProgress);
            return res.json({
                success: true,
                message: "Grammar completed. You have finished all grammars.",
                unlockedGrammars: userProgress.unlockedGrammars
            });
        }
    } catch (error) {
        console.error("Error completing grammar:", error);
        res.status(500).json({ success: false, message: "Error processing completion", error: error.message });
    }
});

module.exports = router;
