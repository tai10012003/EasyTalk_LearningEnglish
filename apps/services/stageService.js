const { StageRepository } = require('./../repositories');

class StageService {
    constructor() {
        this.stageRepository = new StageRepository();
    }

    async getStageList(page = 1, limit = 10) {
        return await this.stageRepository.findStages(page, limit);
    }

    async getStageById(id) {
        return await this.stageRepository.findStageById(id);
    }

    async getStagesInGate(gateId) {
        return await this.stageRepository.findStagesByGate(gateId);
    }

    async insertStage(stageData) {
        return await this.stageRepository.insertStage(stageData);
    }

    async updateStage(stageId, updateData) {
        return await this.stageRepository.updateStage(stageId, updateData);
    }

    async deleteStage(id) {
        return await this.stageRepository.deleteStage(id);
    }

    async deleteStageByGate(gateId) {
        return await this.stageRepository.deleteStagesByGate(gateId);
    }
}

module.exports = StageService;