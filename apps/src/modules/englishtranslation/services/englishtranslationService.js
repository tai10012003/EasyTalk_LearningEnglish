const EnglishTranslationRepository = require("../repositories/englishtranslationRepository");

const ALLOWED_CONTENT_TYPES = new Set(["grammar", "story", "pronunciation"]);
const RESERVED_FIELD_NAMES = new Set([
    "_id",
    "id",
    "contentType",
    "contentId",
    "createdAt",
    "updatedAt",
    "display",
    "sort",
    "images",
    "slug"
]);

class EnglishTranslationService {
    constructor(deps = {}) {
        this.repository = deps.repository || new EnglishTranslationRepository();
    }

    validateContentType(contentType) {
        if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
            throw new Error("Unsupported translation content type");
        }
    }

    sanitizeFields(fields = {}) {
        const sanitized = {};
        Object.entries(fields || {}).forEach(([key, value]) => {
            if (!RESERVED_FIELD_NAMES.has(key)) {
                sanitized[key] = value;
            }
        });
        return sanitized;
    }

    applyTranslation(item, translation) {
        if (!item || !translation?.fields) return item;
        return {
            ...item,
            ...this.sanitizeFields(translation.fields),
            translationMeta: {
                language: "en",
                translated: true,
                updatedAt: translation.updatedAt || null
            }
        };
    }

    async applyTranslations(contentType, items = [], lang = "vi") {
        if (lang !== "en" || !Array.isArray(items) || items.length === 0) {
            return items;
        }
        this.validateContentType(contentType);
        const translations = await this.repository.findByContentIds(
            contentType,
            items.map((item) => item._id)
        );
        const translationMap = new Map(
            translations.map((translation) => [translation.contentId.toString(), translation])
        );
        return items.map((item) => this.applyTranslation(item, translationMap.get(item._id.toString())));
    }

    async applyTranslationToItem(contentType, item, lang = "vi") {
        if (lang !== "en" || !item?._id) return item;
        this.validateContentType(contentType);
        const translation = await this.repository.findByContent(contentType, item._id);
        return this.applyTranslation(item, translation);
    }

    async getTranslation(contentType, contentId) {
        this.validateContentType(contentType);
        return await this.repository.findByContent(contentType, contentId);
    }

    async upsertTranslation(contentType, contentId, fields, metadata = {}) {
        this.validateContentType(contentType);
        return await this.repository.upsert(
            contentType,
            contentId,
            this.sanitizeFields(fields),
            metadata
        );
    }

    async deleteTranslation(contentType, contentId) {
        this.validateContentType(contentType);
        return await this.repository.deleteByContent(contentType, contentId);
    }
}

module.exports = EnglishTranslationService;
