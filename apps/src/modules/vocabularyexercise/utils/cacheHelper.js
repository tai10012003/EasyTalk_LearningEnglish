const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { invalidateContentCache } = require('../../../shared/utils/cacheInvalidation');

async function invalidateVocabularyExerciseCache(options = {}) {
    return await invalidateContentCache('vocabularyexercise', 'Vocabulary Exercise', {
        ...options,
        extraTags: [cacheNs.tag('userprogress', 'detail')]
    });
}

module.exports = { invalidateVocabularyExerciseCache };
