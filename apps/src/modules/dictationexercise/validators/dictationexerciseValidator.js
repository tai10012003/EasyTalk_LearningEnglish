function validateDictationExerciseInput(body) {
    const errors = [];
    if(!body.title || body.title.trim() === '') {
        errors.push('Title is required');
    }
    if(!body.content || body.content.trim() === '') {
        errors.push('Content is required');
    }
    if(body.sort !== undefined) {
        const sort = parseInt(body.sort);
        if(isNaN(sort) || sort < 0) {
            errors.push('Sort must be a non-negative number');
        }
    }
    return { valid: errors.length === 0, errors };
}

module.exports = { validateDictationExerciseInput };