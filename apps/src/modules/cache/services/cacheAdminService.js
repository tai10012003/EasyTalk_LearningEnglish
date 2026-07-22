const crypto = require('crypto');
const cacheNs = require('../../../shared/utils/cacheNamespaces');

const DEFAULT_WARM_UP_MODULES = ['journey', 'grammar', 'story'];

function timingSafeTokenEqual(expected, provided) {
    if (!expected || !provided) return false;
    const expectedDigest = crypto.createHash('sha256').update(String(expected)).digest();
    const providedDigest = crypto.createHash('sha256').update(String(provided)).digest();
    return crypto.timingSafeEqual(expectedDigest, providedDigest);
}

function hasInternalCacheToken(req) {
    return timingSafeTokenEqual(
        process.env.CACHE_ADMIN_TOKEN,
        req.headers['x-cache-admin-token']
    );
}

function tagsForModule(moduleName, resource, id) {
    if (!cacheNs.modules[moduleName]) return [];
    if (resource) return [cacheNs.tag(moduleName, resource, id)];
    const resources = Object.values(cacheNs.modules[moduleName]);
    return [
        cacheNs.tag(moduleName, 'all'),
        ...resources.map(item => cacheNs.tag(moduleName, item))
    ];
}

function allKnownTags() {
    return Object.keys(cacheNs.modules).flatMap(moduleName => tagsForModule(moduleName));
}

function purgeTagsForTarget({ module: moduleName, resource, id, all = false } = {}) {
    return all ? allKnownTags() : tagsForModule(moduleName, resource, id);
}

async function warmUpSelectedCache(services = {}, selectedModules = []) {
    const selected = new Set(selectedModules.length ? selectedModules : DEFAULT_WARM_UP_MODULES);
    const warmed = [];

    if (selected.has('journey') && services.journeyService) {
        await services.journeyService.getJourneyList(1, 10);
        await services.journeyService.getAllJourneysWithDetails();
        warmed.push('journey');
    }
    if (selected.has('grammar') && services.grammarService) {
        await services.grammarService.getGrammarList(1, 12, '', 'user');
        warmed.push('grammar');
    }
    if (selected.has('story') && services.storyService) {
        await services.storyService.getStoryList(1, 12, '', '', '', 'user');
        warmed.push('story');
    }
    if (selected.has('pronunciation') && services.pronunciationService) {
        await services.pronunciationService.getPronunciationList(1, 12, '', 'user');
        warmed.push('pronunciation');
    }

    return warmed;
}

module.exports = {
    allKnownTags,
    hasInternalCacheToken,
    purgeTagsForTarget,
    tagsForModule,
    timingSafeTokenEqual,
    warmUpSelectedCache
};
