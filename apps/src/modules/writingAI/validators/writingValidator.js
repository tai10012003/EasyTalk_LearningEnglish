function validateWritingText(body) {
    const errors = [];
    if(!body.text) {
        errors.push('Text is required');
    }
    if(body.text && body.text.trim().length === 0) {
        errors.push('Text cannot be empty');
    }
    if(body.text && body.text.trim().length < 10) {
        errors.push('Text must be at least 10 characters');
    }
    return { valid: errors.length === 0, errors };
}

module.exports = { validateWritingText };