const { DictationRepository } = require('./../repositories');

class DictationService {
    constructor() {
        this.dictationRepository = new DictationRepository();
    }

    async getDictationList(page = 1, limit = 6) {
        return await this.dictationRepository.findDictations(page, limit);
    }

    async getDictation(id) {
        return await this.dictationRepository.findDictationById(id);
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