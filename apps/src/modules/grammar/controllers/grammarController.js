const express = require("express");
const router = express.Router();
const multer = require("multer");
const { verifyToken, verifyAdmin } = require("../../../shared/middleware/verifyToken");
const GrammarService = require("../services/grammarService");
const { validateGrammarInput, buildGrammarDataFromRequest } = require("../validators/grammarValidator");
let grammarService = new GrammarService();
const { asyncHandler } = require("../../../shared/middleware/errorHandler");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.get("/api/grammar-list", verifyToken, asyncHandler(async function (req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const role = req.user.role || "user";
    const lang = req.query.lang === "en" ? "en" : "vi";
    const { grammars, totalGrammars } = await grammarService.getGrammarList(page, limit, "", role, lang);
    const totalPages = Math.ceil(totalGrammars / limit);
    res.json({ grammars, currentPage: page, totalPages });
}));

router.get("/api/grammar/roadmap", verifyToken, asyncHandler(async function (req, res) {
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { status, data } = await grammarService.getGrammarRoadmap(req.user.id, lang);
        return res.status(status).json(data);
}));

router.get("/api/grammar/:id", verifyToken, asyncHandler(async function (req, res) {
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { status, data } = await grammarService.getGrammarDetails(req.user.id, req.params.id, lang);
        return res.status(status).json(data);
}));

router.get("/api/grammar/slug/:slug", verifyToken, asyncHandler(async function (req, res) {
        const lang = req.query.lang === "en" ? "en" : "vi";
        const { status, data } = await grammarService.getGrammarDetailsBySlug(req.user.id, req.params.slug, lang);
        return res.status(status).json(data);
}));

router.post("/api/grammar/complete/:id", verifyToken, asyncHandler(async (req, res) => {
        const { status, data } = await grammarService.completeGrammar(req.user.id, req.params.id);
        return res.status(status).json(data);
}));

router.post("/api/add", verifyAdmin, upload.single("image"), asyncHandler(async function (req, res) {
        const validation = validateGrammarInput(req.body);
        if (!validation.valid) return res.status(400).json({ message: validation.errors.join(', ') });
        const { status, data } = await grammarService.insertGrammar(buildGrammarDataFromRequest(req.body), req.file || null);
        return res.status(status).json(data);
}));

router.get("/api/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const grammar = await grammarService.getGrammar(req.params.id);
        if (!grammar) {
            return res.status(404).json({ message: "Grammar not found" });
        }
        res.json(grammar);
}));

router.put("/api/update/:id", verifyAdmin, upload.single("image"), asyncHandler(async function (req, res) {
        const validation = validateGrammarInput(req.body);
        if (!validation.valid) return res.status(400).json({ message: validation.errors.join(', ') });
        const { status, data } = await grammarService.updateGrammar(req.params.id, buildGrammarDataFromRequest(req.body), req.file || null);
        return res.status(status).json(data);

}));

router.delete("/api/grammar/:id", verifyAdmin, asyncHandler(async function (req, res) {
        const { status, data } = await grammarService.deleteGrammar(req.params.id);
        return res.status(status).json(data);
}));

module.exports = router;
module.exports.setGrammarService = (service) => {
    grammarService = service;
};
