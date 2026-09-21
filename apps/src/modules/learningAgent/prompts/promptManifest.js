const fs = require('fs');
const path = require('path');

function readPrompt(relativePath) {
    return fs.readFileSync(path.join(__dirname, relativePath), 'utf8').trim().replace(/\s+/g, ' ');
}

const COACH_SYSTEM_PROMPT = readPrompt('system/english-coach.md');

const TASK_PROMPTS = {
    enhance_daily_plan: {
        version: "daily-plan-v1",
        system: readPrompt('tasks/enhance-daily-plan.md'),
        instruction: "Enhance the copy for this daily plan. Preserve every task type and do not include markdown.",
        inputKey: "plan"
    },
    provider_health_check: {
        version: "provider-health-check-v1",
        includeCoachSystem: false,
        system: "Return only valid JSON with this schema: {\"ok\":true,\"message\":\"string\"}.",
        instruction: "Reply with ok=true and a very short message.",
        inputKey: "input"
    },
    agent_chat_reply: {
        version: "agent-chat-reply-v1",
        system: readPrompt('tasks/chat-reply.md'),
        instruction: "Continue this learning chat as a supportive English coach. Correct gently only when useful.",
        inputKey: "input"
    },
    agent_chat_summary: {
        version: "agent-chat-summary-v1",
        system: readPrompt('tasks/chat-summary.md'),
        instruction: "Summarize learning value and extract reusable memory insights.",
        inputKey: "input"
    },
    writing_feedback: {
        version: "writing-feedback-v1",
        system: readPrompt('tasks/writing-feedback.md'),
        instruction: "Analyze this writing submission and return structured JSON only.",
        inputKey: "input"
    }
};

module.exports = {
    COACH_SYSTEM_PROMPT,
    TASK_PROMPTS
};
