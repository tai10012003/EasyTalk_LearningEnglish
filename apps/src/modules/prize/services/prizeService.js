const PrizeRepository = require('../repositories/prizeRepository');

class PrizeService {
    constructor(deps = {}) {
        this.prizeRepository = deps.repository || new PrizeRepository();
        this.englishTranslationService = deps.englishTranslationService || null;
    }

    setEnglishTranslationService(englishTranslationService) {
        this.englishTranslationService = englishTranslationService;
    }

    async applyPrizeTranslations(prizes, lang = "vi") {
        if (!this.englishTranslationService || lang !== "en") return prizes;
        return await this.englishTranslationService.applyTranslations("prize", prizes, lang);
    }

    async applyPrizeTranslation(prize, lang = "vi") {
        if (!this.englishTranslationService || lang !== "en") return prize;
        return await this.englishTranslationService.applyTranslationToItem("prize", prize, lang);
    }

    async getAllPrizes(lang = "vi") {
        const prizes = await this.prizeRepository.findAllPrizes();
        return await this.applyPrizeTranslations(prizes, lang);
    }

    async getPrizeList(page = 1, limit = 12, lang = "vi") {
        const filter = {};
        const result = await this.prizeRepository.findPrizeList(filter, page, limit);
        return {
            ...result,
            prizes: await this.applyPrizeTranslations(result.prizes, lang)
        };
    }

    async getPrizesByType(type, lang = "vi") {
        const prizes = await this.prizeRepository.findByType(type);
        return await this.applyPrizeTranslations(prizes, lang);
    }

    async getPrizeByCode(code, lang = "vi") {
        const prize = await this.prizeRepository.findByCode(code);
        return await this.applyPrizeTranslation(prize, lang);
    }

    async getPrizeById(id, lang = "vi") {
        const prize = await this.prizeRepository.findById(id);
        return await this.applyPrizeTranslation(prize, lang);
    }

    async createPrize(prizeData) {
        const result = await this.prizeRepository.insert(prizeData);
        return result;
    }

    async updatePrize(id, updateData) {
        const result = await this.prizeRepository.update(id, updateData);
        return result;
    }

    async deletePrize(id) {
        const result = await this.prizeRepository.delete(id);
        return result;
    }
}

module.exports = PrizeService;
