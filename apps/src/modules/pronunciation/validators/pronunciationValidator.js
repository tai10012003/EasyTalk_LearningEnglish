function validatePronunciationInput(body) {
    const errors = [];
    if (!body.title || body.title.trim() === '') {
        errors.push('Title is required');
    }
    if (!body.description || body.description.trim() === '') {
        errors.push('Description is required');
    }
    if (!body.content || body.content.trim() === '') {
        errors.push('Content is required');
    }
    if (!body.category || body.category.trim() === '') {
        errors.push('Category is required');
    }
    if (!body.level || body.level.trim() === '') {
        errors.push('Level is required');
    }
    if (body.sort !== undefined) {
        const sort = parseInt(body.sort);
        if (isNaN(sort) || sort < 0) {
            errors.push('Sort must be a non-negative number');
        }
    }
    return { valid: errors.length === 0, errors };
}

function parseQuizzes(quizzesString) {
    try {
        if (!quizzesString) return [];
        return JSON.parse(quizzesString);
    } catch (e) {
        console.error("Parse quizzes error:", e);
        return [];
    }
}

module.exports = { validatePronunciationInput, parseQuizzes };