var express = require("express");
var router = express.Router();
const OpenAI = require("openai");

let franc;
(async () => {
    const module = await import("franc-min");
    franc = module.franc;
})();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


router.get("/", function(req, res) {
    res.render("chat");
});

router.post("/api/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }
    const detectedLanguage = franc(message);

    if (detectedLanguage !== "eng" && message.length > 3) {
        const englishWords = ["hello", "how", "are", "you", "what"];
        const isLikelyEnglish = englishWords.some(word =>
            message.toLowerCase().includes(word)
        );

        if (!isLikelyEnglish) {
            return res.json({
                response: "I don't understand, please speak in English.",
            });
        }
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: message }],
        });

        const gptResponse = response.choices[0].message.content;
        res.json({ response: gptResponse });
    } catch (error) {
        console.error(
            "OpenAI API error:",
            error.response ? error.response.data : error.message
        );
        res.status(500).json({ error: "Error processing request" });
    }
});


module.exports = router;