const { isValidStep } = require('../utils/conversationState');

function validateChatMessage(body) {
    const errors = [];
    if(!body.message || body.message.trim().length === 0) {
        errors.push('Message is required');
    }
    if(body.step && !isValidStep(body.step)) {
        errors.push('Invalid conversation step');
    }
    return { valid: errors.length === 0, errors };
}

module.exports = { validateChatMessage };