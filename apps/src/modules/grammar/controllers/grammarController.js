const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const { cacheMiddleware } = require('../../../shared/middleware/cacheMiddleware');
const GrammarService = require("../services/grammarService");
const { validateGrammarInput, buildGrammarDataFromRequest } = require("../validators/grammarValidator");
const grammarService = new GrammarService();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/api/grammar-list", verifyToken, cacheMiddleware(300), async function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    try {
        const role = req.user.role || "user";
        const { grammars, totalGrammars } = await grammarService.getGrammarList(page, limit, "", role);
        const totalPages = Math.ceil(totalGrammars / limit);
        res.json({ grammars, currentPage: page, totalPages });
    } catch (err) {
        res.status(500).json({ message: "Error fetching grammars", error: err.message });
    }
});

router.get("/api/grammar/:id", verifyToken, async function (req, res) {
    try {
        const { status, data } = await grammarService.getGrammarDetails(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (err) {
        res.status(500).json({ message: "Error fetching grammar details", error: err.message });
    }
});

router.get("/api/grammar/slug/:slug", verifyToken, cacheMiddleware(300), async function (req, res) {
    try {
        const grammar = await grammarService.getGrammarBySlug(req.params.slug);
        if (!grammar) {
            return res.status(404).json({ message: "Grammar not found" });
        }
        res.json({ grammar });
    } catch (err) {
        res.status(500).json({ message: "Error fetching grammar details", error: err.message });
    }
});

router.post("/api/grammar/complete/:id", verifyToken, async (req, res) => {
    try {
        const { status, data } = await grammarService.completeGrammar(req.user.id, req.params.id);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Error completing grammar:", error);
        res.status(500).json({ success: false, message: "Error processing completion", error: error.message });
    }
});

router.post("/api/add", verifyAdmin, upload.single("image"), async function (req, res) {
    try {
        const validation = validateGrammarInput(req.body);
        if (!validation.valid) return res.status(400).json({ message: validation.errors.join(', ') });
        const { status, data } = await grammarService.insertGrammar(buildGrammarDataFromRequest(req.body), req.file || null);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Add grammar error:", error);
        res.status(500).json({ message: "Error adding grammar", error: error.message });
    }
});

router.get("/api/:id", verifyAdmin, cacheMiddleware(600), async function (req, res) {
    try {
        const grammar = await grammarService.getGrammar(req.params.id);
        if (!grammar) {
            return res.status(404).json({ message: "Grammar not found" });
        }
        res.json(grammar);
    } catch (err) {
        console.error("Error fetching grammar:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.put("/api/update/:id", verifyAdmin, upload.single("image"), async function (req, res) {
    try {
        const validation = validateGrammarInput(req.body);
        if (!validation.valid) return res.status(400).json({ message: validation.errors.join(', ') });
        const { status, data } = await grammarService.updateGrammar(req.params.id, buildGrammarDataFromRequest(req.body), req.file || null);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Update grammar error:", error);
        res.status(500).json({ message: "Error updating grammar", error: error.message });
    }
});

router.delete("/api/grammar/:id", verifyAdmin, async function (req, res) {
    try {
        const { status, data } = await grammarService.deleteGrammar(req.params.id);
        return res.status(status).json(data);
    } catch (error) {
        console.error("Delete grammar error:", error);
        res.status(500).json({ message: "Error deleting grammar", error: error.message });
    }
});

module.exports = router;
