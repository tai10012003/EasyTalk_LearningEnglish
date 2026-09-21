const cache = require('../../../shared/utils/cacheService');
const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { policies, withTags } = require('../../../shared/utils/cachePolicies');
const JourneyRepository = require('../repositories/journeyRepository');
const { invalidateJourneyCache } = require('../utils/cacheHelper');

class JourneyService {
    constructor(deps = {}) {
        const options = typeof deps.findAll === 'function' ? { repository: deps } : deps;
        this.repository = options.repository || new JourneyRepository();
        this.cache = options.cacheService || cache;
        this.englishTranslationService = options.englishTranslationService || null;
    }

    async getJourneyList(page = 1, limit = 10, options = {}) {
        const cacheKey = cacheNs.listKey('journey', { page, limit });
        const result = await this.cache.getOrSet(cacheKey, withTags(policies.relationList('journey'), cacheNs.listTags('journey')), async () => {
            const { journeys, total } = await this.repository.findAll(page, limit);
            return { journeys, totalJourneys: total };
        });
        return {
            ...result,
            journeys: await this.applyJourneyTranslations(result.journeys, options.lang)
        };
    }

    async getAllJourneysWithDetails(options = {}) {
        const cacheKey = cacheNs.key('journey', 'details', { id: 'all' });
        const journeys = await this.cache.getOrSet(cacheKey, withTags(policies.relationList('journey'), [cacheNs.tag('journey', 'details'), cacheNs.tag('journey', 'all')]), async () => {
            return await this.repository.findAllWithDetails();
        });
        return await this.applyJourneyTreeTranslations(journeys, options.lang);
    }

    async getJourneyWithDetails(journeyId, options = {}) {
        const cacheKey = cacheNs.key('journey', 'details', { id: journeyId });
        const journey = await this.cache.getOrSet(cacheKey, withTags(policies.relationDetail('journey'), [cacheNs.tag('journey', 'details'), cacheNs.tag('journey', 'details', journeyId), cacheNs.tag('journey', 'all')]), async () => {
            return await this.repository.findByIdWithDetails(journeyId);
        });
        const [localizedJourney] = await this.applyJourneyTreeTranslations(journey ? [journey] : [], options.lang);
        return localizedJourney || null;
    }

    async getJourney(id) {
        return await this.repository.findById(id);
    }

    async insertJourney(journey) {
        const result = await this.repository.insert(journey);
        await invalidateJourneyCache();
        return result;
    }

    async addGateToJourney(journeyId, gateId) {
        const result = await this.repository.addGate(journeyId, gateId);
        await invalidateJourneyCache();
        return result;
    }

    async removeGateFromJourney(journeyId, gateId) {
        const result = await this.repository.removeGate(journeyId, gateId);
        await invalidateJourneyCache();
        return result;
    }

    async updateJourney(journey) {
        const { _id, ...updateData } = journey;
        const result = await this.repository.update(_id, updateData);
        await invalidateJourneyCache();
        return result;
    }

    async deleteJourney(id) {
        const result = await this.repository.delete(id);
        await invalidateJourneyCache();
        return result;
    }

    async applyJourneyTranslations(journeys = [], lang = "vi") {
        if (lang !== "en" || !this.englishTranslationService) return journeys;
        return await this.englishTranslationService.applyTranslations("journey", journeys, lang);
    }

    async applyJourneyTreeTranslations(journeys = [], lang = "vi") {
        if (lang !== "en" || !this.englishTranslationService || !Array.isArray(journeys) || journeys.length === 0) {
            return journeys;
        }
        const localizedJourneys = await this.englishTranslationService.applyTranslations("journey", journeys, lang);
        const gates = localizedJourneys.flatMap((journey) => (journey.gates || []).filter((gate) => gate?._id));
        const localizedGates = await this.englishTranslationService.applyTranslations("gate", gates, lang);
        const gateMap = new Map(localizedGates.map((gate) => [gate._id.toString(), gate]));
        const stages = localizedGates.flatMap((gate) => (gate.stages || []).filter((stage) => stage?._id));
        const localizedStages = await this.englishTranslationService.applyTranslations("stage", stages, lang);
        const stageMap = new Map(localizedStages.map((stage) => [stage._id.toString(), stage]));
        return localizedJourneys.map((journey) => ({
            ...journey,
            gates: (journey.gates || [])
            .filter((gate) => gate?._id)
            .map((gate) => {
                const localizedGate = gateMap.get(gate._id.toString()) || gate;
                return {
                    ...localizedGate,
                    stages: (localizedGate.stages || []).filter((stage) => stage?._id).map((stage) => stageMap.get(stage._id.toString()) || stage)
                };
            })
        }));
    }
}

module.exports = JourneyService;
