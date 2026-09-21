const DictationExercise = require('../models/dictationexercise');

function validateDictationExerciseInput(body) {
    const errors = DictationExercise.validate({
        title: body.title,
        content: body.content,
        sort: body.sort !== undefined ? Number(body.sort) : undefined
    });
    return { valid: errors.length === 0, errors };
}

function buildDictationExerciseDataFromRequest(body) {
    return {
        title: body.title,
        description: body.description || '',
        content: body.content,
        slug: body.slug,
        sort: parseInt(body.sort) || 0,
        display: body.display !== undefined ? body.display === 'true' || body.display === true : true
    };
}

module.exports = { validateDictationExerciseInput, buildDictationExerciseDataFromRequest };