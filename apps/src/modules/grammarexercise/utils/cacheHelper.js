const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { invalidateContentCache } = require('../../../shared/utils/cacheInvalidation');

async function invalidateGrammarExerciseCache(options = {}) {
    return await invalidateContentCache('grammarexercise', 'Grammar Exercise', {
        ...options,
        extraTags: [cacheNs.tag('userprogress', 'detail')]
    });
}

module.exports = { invalidateGrammarExerciseCache };
