const { COACH_SYSTEM_PROMPT, TASK_PROMPTS } = require('../prompts/promptManifest');

class PromptTemplateService {
    constructor(options = {}) {
        this.coachSystemPrompt = options.coachSystemPrompt || COACH_SYSTEM_PROMPT;
        this.taskPrompts = options.taskPrompts || TASK_PROMPTS;
    }

    buildOpenAIMessages(task, input) {
        const prompt = this.taskPrompts[task];
        if (!prompt) {
            return [
                { role: "system", content: "Return only valid JSON." },
                { role: "user", content: JSON.stringify({ task, input }) }
            ];
        }

        return [
            {
                role: "system",
                content: this.buildSystemContent(prompt)
            },
            {
                role: "user",
                content: JSON.stringify(this.buildUserContent(prompt, input))
            }
        ];
    }

    buildSystemContent(prompt) {
        if (prompt.includeCoachSystem === false) return prompt.system;
        return [this.coachSystemPrompt, prompt.system].filter(Boolean).join(" ");
    }

    buildUserContent(prompt, input) {
        return {
            instruction: prompt.instruction,
            [prompt.inputKey || "input"]: input
        };
    }

    buildCoachSystemPrompt() {
        return this.coachSystemPrompt;
    }

    getPromptVersion(task) {
        return this.taskPrompts[task]?.version || "unknown";
    }
}

module.exports = PromptTemplateService;
