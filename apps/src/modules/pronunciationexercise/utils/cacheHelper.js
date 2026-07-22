const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { invalidateContentCache } = require('../../../shared/utils/cacheInvalidation');

async function invalidatePronunciationExerciseCache(options = {}) {
    return await invalidateContentCache('pronunciationexercise', 'Pronunciation Exercise', {
        ...options,
        extraTags: [cacheNs.tag('userprogress', 'detail')]
    });
}

module.exports = { invalidatePronunciationExerciseCache };
