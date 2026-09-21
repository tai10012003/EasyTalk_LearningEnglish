function validateCreateNotification(body) {
    const errors = [];
    if (!body.title || body.title.trim() === '') {
        errors.push('Tiêu đề không được bỏ trống');
    }
    if (!body.message || body.message.trim() === '') {
        errors.push('Nội dung không được bỏ trống');
    }
    const validTypes = ['info', 'success', 'warning', 'error', 'system', 'achieve', 'champion', 'streak_lost'];
    if (body.type && !validTypes.includes(body.type)) {
        errors.push(`Type phải là một trong: ${validTypes.join(', ')}`);
    }
    return { valid: errors.length === 0, errors };
}

module.exports = { validateCreateNotification };