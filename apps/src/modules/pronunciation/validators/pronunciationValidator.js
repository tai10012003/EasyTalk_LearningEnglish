const { Pronunciation } = require('../models/pronunciation');

function parseQuizzes(quizzesString) {
    try {
        if (!quizzesString) return [];
        if (typeof quizzesString !== 'string') return quizzesString;
        return JSON.parse(quizzesString);
    } catch (e) {
        console.error("Parse quizzes error:", e);
        return [];
    }
}

function validatePronunciationInput(body) {
    const quizzes = parseQuizzes(body.quizzes);
    const errors = Pronunciation.validate({
        title: body.title,
        description: body.description,
        category: body.category,
        level: body.level,
        content: body.content,
        sort: body.sort !== undefined ? Number(body.sort) : undefined,
        quizzes
    });
    return { valid: errors.length === 0, errors };
}

function buildPronunciationDataFromRequest(body) {
    return {
        title: body.title,
        description: body.description,
        category: body.category,
        level: body.level,
        content: body.content,
        images: body.images || null,
        quizzes: parseQuizzes(body.quizzes),
        slug: body.slug,
        sort: parseInt(body.sort) || 0,
        display: body.display !== undefined ? body.display === 'true' || body.display === true : true
    };
}

module.exports = { validatePronunciationInput, buildPronunciationDataFromRequest, parseQuizzes };