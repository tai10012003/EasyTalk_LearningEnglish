const { DictationRepository } = require('./../repositories');

class DictationService {
    constructor() {
        this.dictationRepository = new DictationRepository();
    }

    async getDictationList(page = 1, limit = 12, role = "user") {
        const filter = {};
        if (role !== "admin") {
            filter.display = true;
        }
        return await this.dictationRepository.findDictations(filter, page, limit);
    }

    async getDictation(id) {
        return await this.dictationRepository.findDictationById(id);
    }

    async getDictationBySlug(slug) {
        return await this.dictationRepository.findDictationBySlug(slug);
    }

    async insertDictation(dictationData) {
        return await this.dictationRepository.insertDictation(dictationData);
    }

    async updateDictation(dictationData) {
        return await this.dictationRepository.updateDictation(dictationData);
    }

    async deleteDictation(id) {
        return await this.dictationRepository.deleteDictation(id);
    }
}

module.exports = DictationService;