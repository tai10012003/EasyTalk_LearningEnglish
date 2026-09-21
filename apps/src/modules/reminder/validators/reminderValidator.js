function validateReminderInput(body) {
    const errors = [];
    if(!body.email || body.email.trim() === '') {
        errors.push('Email is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(body.email && !emailRegex.test(body.email)) {
        errors.push('Invalid email format');
    }
    if(!body.reminderTime) {
        errors.push('Reminder time is required');
    }
    const validFrequencies = ['one-time', 'daily', 'weekly', 'monthly'];
    if(body.frequency && !validFrequencies.includes(body.frequency.toLowerCase())) {
        errors.push(`Frequency must be one of: ${validFrequencies.join(', ')}`);
    }
    return { valid: errors.length === 0, errors };
}

module.exports = { validateReminderInput };