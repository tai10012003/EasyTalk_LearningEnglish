function validateJourneyInput(body) {
    const errors = [];
    if(!body.title || body.title.trim() === '') {
        errors.push('Title is required');
    }
    return { valid: errors.length === 0, errors };
}

module.exports = { validateJourneyInput };