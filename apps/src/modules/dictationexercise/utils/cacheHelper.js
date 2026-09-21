const cacheNs = require('../../../shared/utils/cacheNamespaces');
const { invalidateContentCache } = require('../../../shared/utils/cacheInvalidation');

async function invalidateDictationExerciseCache(options = {}) {
    return await invalidateContentCache('dictation', 'Dictation Exercise', {
        ...options,
        extraTags: [cacheNs.tag('userprogress', 'detail')]
    });
}

module.exports = { invalidateDictationExerciseCache };
