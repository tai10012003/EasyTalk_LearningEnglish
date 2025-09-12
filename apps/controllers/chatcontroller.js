var express = require("express");
var router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

router.get("/api/chat/start", async (req, res) => {
    try {
        const prompt = `
            You are a cheerful and friendly AI English conversation partner.
            Greet the user warmly and introduce yourself briefly with excitement.
            Ask ONLY one simple question: ask for the user's name.
            Use a happy, motivating tone.
            Example: "Hello! I'm really excited to chat with you. What's your name?"
        `;
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: prompt }],
        });

        const gptResponse = response.choices[0].message.content;
        res.json({ response: gptResponse, step: "ask_name" });
    } catch (error) {
        console.error("OpenAI API error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Error starting conversation" });
    }
});

router.post("/api/chat", async (req, res) => {
    const { message, step, sessionTopic } = req.body;

    if (!message || message.trim().length == 0) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        let prompt;
        let topic = sessionTopic;
        let nextStep = step;

        if (step == "ask_name") {
            prompt = `
                The user told you their name is "${message}".
                RULES:
                1. Reply warmly and happily, acknowledging their name.
                2. If the user asks about your name, answer briefly and naturally..
                3. Then ask ONLY about their AGE.
            `;
            nextStep = "ask_age";
        }
        else if (step == "ask_age") {
            prompt = `
                The user just told you their age: "${message}".
                RULES:
                1. Acknowledge their age in a natural, cheerful way.
                2. If the user asks about your age, answer briefly and naturally.
                3. Then ask ONLY about where they LIVE.
            `;
            nextStep = "ask_location";
        }
        else if (step == "ask_location") {
            const topics = ["family", "school", "shopping", "entertainment", "hobbies", "travel"];
            topic = topics[Math.floor(Math.random() * topics.length)];

            prompt = `
                The user just told you where they live: "${message}".
                RULES:
                1. Acknowledge their location briefly in a friendly way.
                2. If the user asks "Where do you live?" reply naturally.
                3. After acknowledging, IMMEDIATELY say:
                   "Let's start with the topic: ${topic}."
                4. Then ask ONE simple question about ${topic}.
            `;
            nextStep = "chat_topic";
        }
        else {
            prompt = `
                You are continuing a conversation on the topic: ${topic}.
                RULES:
                1. Respond in a warm, cheerful tone.
                2. Use natural expressions.
                3. Always ask only ONE follow-up question.
                4. If the user explicitly asks for a new topic, switch politely.
                5. If the user says "end" or "stop", conclude politely.
            `;
            nextStep = "chat_topic";
        }

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: message },
            ],
        });

        const gptResponse = response.choices[0].message.content;
        res.json({ response: gptResponse, topic, step: nextStep });
    } catch (error) {
        console.error("OpenAI API error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Error processing request" });
    }
});

module.exports = router;