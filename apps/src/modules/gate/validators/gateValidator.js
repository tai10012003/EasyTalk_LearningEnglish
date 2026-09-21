function validateGateInput(body) {
    const errors = [];
    if(!body.title || body.title.trim() === '') {
        errors.push('Title is required');
    }
    if(!body.journeyId) {
        errors.push('Journey is required');
    }
    return { valid: errors.length === 0, errors };
}

module.exports = { validateGateInput };