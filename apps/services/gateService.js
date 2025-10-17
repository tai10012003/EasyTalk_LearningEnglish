const { GateRepository } = require('./../repositories');

class GateService {
    constructor() {
        this.gateRepository = new GateRepository();
    }

    async getGateList(page = 1, limit = 12) {
        return await this.gateRepository.findGates(page, limit);
    }

    async getGateById(gateId) {
        return await this.gateRepository.findGateById(gateId);
    }

    async getGatesInJourney(journeyId) {
        return await this.gateRepository.findGatesByJourney(journeyId);
    }

    async insertGate(gate) {
        return await this.gateRepository.insertGate(gate);
    }

    async updateGate(gate) {
        return await this.gateRepository.updateGate(gate);
    }

    async deleteGate(id) {
        return await this.gateRepository.deleteGate(id);
    }

    async deleteGatesByJourney(journeyId) {
        return await this.gateRepository.deleteGatesByJourney(journeyId);
    }

    async addStageToGate(gateId, stageId) {
        return await this.gateRepository.addStage(gateId, stageId);
    }

    async removeStageFromGate(gateId, stageId) {
        return await this.gateRepository.removeStage(gateId, stageId);
    }
}

module.exports = GateService;