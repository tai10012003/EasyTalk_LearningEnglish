const { ObjectId } = require('mongodb');
const { PrizeRepository } = require('./../repositories');

class PrizeService {
    constructor() {
        this.prizeRepository = new PrizeRepository();
    }

    async getAllPrizes() {
        const prizes = await this.prizeRepository.findAllPrizes();
        return prizes;
    }

    async getPrizeList(page = 1, limit = 12) {
        const filter = {};
        const result = await this.prizeRepository.findPrizeList(filter, page, limit);
        return result;
    }

    async getPrizesByType(type) {
        return await this.prizeRepository.findByType(type);
    }

    async getPrizeByCode(code) {
        return await this.prizeRepository.findByCode(code);
    }

    async getPrizeById(id) {
        return await this.prizeRepository.findById(id);
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