const { VocabularyExercise } = require('../models/vocabularyexercise');

function validateVocabularyExerciseInput(body) {
    const errors = VocabularyExercise.validate({
        title: body.title,
        sort: body.sort !== undefined ? Number(body.sort) : undefined,
        questions: Array.isArray(body.questions) ? body.questions : []
    });
    return { valid: errors.length === 0, errors };
}

function buildVocabularyExerciseDataFromRequest(body) {
    return {
        title: body.title,
        questions: Array.isArray(body.questions) ? body.questions : [],
        slug: body.slug,
        sort: parseInt(body.sort) || 0,
        display: body.display !== undefined ? body.display === 'true' || body.display === true : true
    };
}

module.exports = { validateVocabularyExerciseInput, buildVocabularyExerciseDataFromRequest };