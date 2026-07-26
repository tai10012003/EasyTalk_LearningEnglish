const AIUsageService = require("./aiUsageService");
const { getVietnamDate } = require("../../../shared/utils/dateFormat");

class AITextToSpeechService {
    constructor(options = {}) {
        this.provider = options.provider || process.env.AI_TTS_PROVIDER || process.env.AI_PROVIDER || "mock";
        this.mode = options.mode || process.env.AI_TTS_PROVIDER_MODE || process.env.AI_PROVIDER_MODE || "mock";
        this.model = options.model || process.env.AI_TTS_MODEL || "gpt-4o-mini-tts";
        this.voice = options.voice || process.env.AI_TTS_VOICE || "coral";
        this.instructions = options.instructions || process.env.AI_TTS_INSTRUCTIONS || "Speak Vietnamese naturally, warmly, and clearly as a friendly English learning coach.";
        this.responseFormat = options.responseFormat || process.env.AI_TTS_RESPONSE_FORMAT || "mp3";
        this.speed = Number.parseFloat(options.speed || process.env.AI_TTS_SPEED || "1.0");
        this.timeoutMs = Number.parseInt(options.timeoutMs || process.env.AI_TTS_TIMEOUT_MS || "12000", 10);
        this.dailyLimitPerUser = Number.parseInt(options.dailyLimitPerUser || process.env.AI_TTS_DAILY_LIMIT_PER_USER || "30", 10);
        this.pricePerMillionCharacters = Number.parseFloat(options.pricePerMillionCharacters || process.env.AI_TTS_PRICE_PER_MILLION_CHARS || "0");
        this.openAIClient = options.openAIClient || null;
        this.aiUsageService = options.aiUsageService || new AIUsageService();
    }

    isMock() {
        return this.provider === "mock" || this.mode === "mock";
    }

    getStatus() {
        return {
            provider: this.provider,
            mode: this.mode,
            model: this.model,
            voice: this.voice,
            responseFormat: this.responseFormat,
            isMock: this.isMock(),
            timeoutMs: this.timeoutMs,
            dailyLimitPerUser: this.dailyLimitPerUser
        };
    }

    async synthesize({ userId, text }) {
        const input = this.sanitizeInput(text);
        if (!input) {
            const error = new Error("Nội dung TTS không được để trống.");
            error.statusCode = 400;
            error.code = "AI_TTS_EMPTY_TEXT";
            throw error;
        }

        await this.assertWithinDailyLimit(userId);

        if (this.isMock()) {
            const error = new Error("AI TTS provider is in mock mode.");
            error.statusCode = 503;
            error.code = "AI_TTS_MOCK_MODE";
            throw error;
        }

        if (this.provider !== "openai") {
            const error = new Error(`AI TTS provider "${this.provider}" is not implemented.`);
            error.statusCode = 501;
            error.code = "AI_TTS_PROVIDER_NOT_IMPLEMENTED";
            throw error;
        }

        const startedAt = Date.now();
        const audioBuffer = await this.generateOpenAISpeech(input);
        await this.recordUsage(userId, input, Date.now() - startedAt);

        return {
            audioBuffer,
            contentType: this.getContentType(),
            metadata: this.getStatus()
        };
    }

    sanitizeInput(text) {
        if (typeof text !== "string") return "";
        return text.replace(/\s+/g, " ").trim().slice(0, 1200);
    }

    async assertWithinDailyLimit(userId) {
        if (!userId || !this.dailyLimitPerUser || this.dailyLimitPerUser <= 0) return;
        const used = await this.aiUsageService.countTaskUsage(userId, getVietnamDate(), "coach_tts");
        if (used >= this.dailyLimitPerUser) {
            const error = new Error(`Bạn đã đạt giới hạn ${this.dailyLimitPerUser} lượt giọng nói AI hôm nay.`);
            error.statusCode = 429;
            error.code = "AI_TTS_DAILY_LIMIT_REACHED";
            throw error;
        }
    }

    async generateOpenAISpeech(input) {
        const client = this.getOpenAIClient();
        const response = await this.withTimeout(
            client.audio.speech.create({
                model: this.model,
                voice: this.voice,
                input,
                instructions: this.instructions,
                response_format: this.responseFormat,
                speed: this.speed
            }),
            this.timeoutMs
        );
        return Buffer.from(await response.arrayBuffer());
    }

    getOpenAIClient() {
        if (this.openAIClient) return this.openAIClient;
        if (!process.env.OPENAI_API_KEY) {
            const error = new Error("OPENAI_API_KEY is required for OpenAI TTS.");
            error.statusCode = 500;
            error.code = "OPENAI_API_KEY_MISSING";
            throw error;
        }
        const OpenAI = require("openai");
        this.openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        return this.openAIClient;
    }

    async withTimeout(promise, timeoutMs) {
        if (!timeoutMs || timeoutMs <= 0) return await promise;
        let timer = null;
        try {
            return await Promise.race([
                promise,
                new Promise((_, reject) => {
                    timer = setTimeout(() => {
                        const error = new Error(`AI TTS provider timed out after ${timeoutMs}ms.`);
                        error.statusCode = 504;
                        error.code = "AI_TTS_TIMEOUT";
                        reject(error);
                    }, timeoutMs);
                })
            ]);
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    async recordUsage(userId, input, latencyMs) {
        if (!userId || !this.aiUsageService) return;
        const characters = input.length;
        await this.aiUsageService.recordUsage(userId, {
            task: "coach_tts",
            provider: this.provider,
            mode: this.mode,
            model: this.model,
            inputTokens: characters,
            outputTokens: 0,
            totalTokens: characters,
            estimatedCostUsd: this.estimateCost(characters),
            metadata: {
                isMock: false,
                usageSource: "characters",
                characters,
                voice: this.voice,
                responseFormat: this.responseFormat,
                latencyMs
            }
        });
    }

    estimateCost(characters) {
        if (!this.pricePerMillionCharacters) return 0;
        return Number(((characters / 1000000) * this.pricePerMillionCharacters).toFixed(8));
    }

    getContentType() {
        const types = {
            mp3: "audio/mpeg",
            opus: "audio/opus",
            aac: "audio/aac",
            flac: "audio/flac",
            wav: "audio/wav",
            pcm: "audio/pcm"
        };
        return types[this.responseFormat] || "audio/mpeg";
    }
}

module.exports = AITextToSpeechService;
