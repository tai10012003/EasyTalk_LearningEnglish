const { PronunciationExercise } = require('../models/pronunciationexercise');

function validatePronunciationExerciseInput(body) {
    const errors = PronunciationExercise.validate({
        title: body.title,
        sort: body.sort !== undefined ? Number(body.sort) : undefined,
        questions: Array.isArray(body.questions) ? body.questions : []
    });
    return { valid: errors.length === 0, errors };
}

function buildPronunciationExerciseDataFromRequest(body) {
    return {
        title: body.title,
        questions: Array.isArray(body.questions) ? body.questions : [],
        slug: body.slug,
        sort: parseInt(body.sort) || 0,
        display: body.display !== undefined ? body.display === 'true' || body.display === true : true
    };
}

module.exports = { validatePronunciationExerciseInput, buildPronunciationExerciseDataFromRequest };
