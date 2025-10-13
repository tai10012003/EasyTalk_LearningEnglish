const { JourneyRepository } = require('./../repositories');

class JourneyService {
    constructor() {
        this.journeyRepository = new JourneyRepository();
    }

    async getJourneyList(page = 1, limit = 10) {
        return await this.journeyRepository.findJourneys(page, limit);
    }

    async getAllJourneysWithDetails() {
        return await this.journeyRepository.findAllJourneysWithDetails();
    }

    async getJourneyWithDetails(journeyId) {
        return await this.journeyRepository.findJourneyWithDetails(journeyId);
    }

    async getJourney(id) {
        return await this.journeyRepository.findJourneyById(id);
    }

    async insertJourney(journey) {
        return await this.journeyRepository.insertJourney(journey);
    }

    async addGateToJourney(journeyId, gateId) {
        return await this.journeyRepository.addGate(journeyId, gateId);
    }

    async removeGateFromJourney(journeyId, gateId) {
        return await this.journeyRepository.removeGate(journeyId, gateId);
    }

    async updateJourney(journey) {
        return await this.journeyRepository.updateJourney(journey);
    }

    async deleteJourney(id) {
        return await this.journeyRepository.deleteJourney(id);
    }
}

module.exports = JourneyService;