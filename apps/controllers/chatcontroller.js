var express = require("express");
var router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

router.get("/api/chat/start", async (req, res) => {
    try {
        const prompt = `
            You are a cheerful, friendly, and emotionally expressive AI English conversation partner.
            Greet the user warmly and introduce yourself briefly with excitement.
            Ask ONLY one simple question: ask for the user's name.
            Use a happy, motivating tone.
            Example: "Hello! I'm really excited to chat with you. What's your name?"
            Respond naturally, like a real person.
        `;
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: prompt }],
        });
        const gptResponse = response.choices[0].message.content;
        const suggestionPrompt = `
            Based on this bot message: "${gptResponse}", 
            create TWO short, simple example replies that the user might say. 
            ⚠️ Important: If the bot message contains multiple questions, 
            only answer the LAST question the bot asked. 
            They must be direct answers (not questions).
            Format:
            1. ...
            2. ...
            Keep them very short and natural.
        `;
        const suggestionRes = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: suggestionPrompt }],
        });

        const suggestion = suggestionRes.choices[0].message.content;

        res.json({ response: gptResponse, suggestion, step: "ask_name" });
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
                You are cheerful, expressive, and emotionally engaging.
                RULES:
                1. Always acknowledge the user's name warmly.
                2. Ask ONLY ONE simple question about their AGE.
                3. Mandatory response: If the user asks for your name, respond as clearly and specifically as possible (e.g. "My name is Taylor").
                4. Do NOT skip answering repeated questions about name, age, or location.
                5. Respond naturally like a real person, no filler sentences.
                `;
            nextStep = "ask_age";
        } else if (step == "ask_age") {
            prompt = `
                The user just told you their age: "${message}".
                You are cheerful, expressive, and emotionally engaging.
                RULES:
                1. Always acknowledge the user's age warmly and enthusiastically.
                2. Ask ONLY ONE simple question about where they LIVE.
                3. Mandatory response: If a user asks your age, answer as clearly and specifically as possible (e.g. "I am 25 years old").
                4. Do NOT skip answering repeated questions about name, age, or location.
                5. Respond naturally like a real person, no filler sentences.
                `;
            nextStep = "ask_location";
        } else if (step == "ask_location") {
            const topics = ["family", "school", "shopping", "entertainment", "hobbies", "travel"];
            topic = topics[Math.floor(Math.random() * topics.length)];
           prompt = `
                The user just told you where they live: "${message}".
                You are cheerful, expressive, and emotionally engaging.
                RULES:
                1. Always acknowledge the user's location warmly.
                2. Immediately say: "Let's start with the topic: ${topic}."
                3. Ask ONLY ONE simple question about ${topic}.
                4. Mandatory response: If the user asks where you live, answer as clearly and specifically as possible (e.g. "I live in London").
                5. Do NOT ask multiple questions at the same time.
                6. Do NOT skip answering repeated questions about name, age, or location.
                7. Respond naturally like a real person, no filler sentences.
                `;
            nextStep = "chat_topic";
        } else {
            prompt = `
                You are continuing a friendly, natural English conversation with the user on the topic: ${topic}.
                You are cheerful, expressive, and emotionally engaging.
                RULES:
                1. Compliment or praise the user naturally when appropriate.
                2. Ask ONLY ONE follow-up question on the topic.
                3. If the user explicitly wants to change topic, switch gracefully and introduce the new topic.
                4. If the user asks your name, age, or location, answer clearly and specifically.
                5. Do NOT skip answering repeated questions about name, age, or location.
                6. If the user says "end" or "stop", conclude politely in one sentence.
                7. Respond naturally like a real person, no filler sentences.
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
        const suggestionPrompt = `
            Based on this bot message: "${gptResponse}", 
            create TWO short, simple example replies that the user might say. 
            ⚠️ Important: If the bot message contains multiple questions, 
            only answer the LAST question the bot asked. 
            They must be direct answers (not questions).
            Format:
            1. ...
            2. ...
            Keep them very short and natural.
        `;
        const suggestionRes = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "system", content: suggestionPrompt }],
        });
        const suggestion = suggestionRes.choices[0].message.content;

        res.json({ response: gptResponse, suggestion, topic, step: nextStep });
    } catch (error) {
        console.error("OpenAI API error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Error processing request" });
    }
});

module.exports = router;