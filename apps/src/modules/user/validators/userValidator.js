function validateRegisterInput(body) {
    const errors = [];
    if(!body.username || body.username.trim() === '') {
        errors.push('Username is required');
    }
    if(!body.email || body.email.trim() === '') {
        errors.push('Email is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(body.email && !emailRegex.test(body.email)) {
        errors.push('Invalid email format');
    }
    if(!body.password || body.password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }
    return { valid: errors.length === 0, errors };
}

function validateLoginInput(body) {
    const errors = [];
    if(!body.email || body.email.trim() === '') {
        errors.push('Email is required');
    }
    if(!body.password || body.password.trim() === '') {
        errors.push('Password is required');
    }
    return { valid: errors.length === 0, errors };
}

function validateChangePasswordInput(body) {
    const errors = [];
    if(!body.currentPassword) {
        errors.push('Current password is required');
    }
    if(!body.newPassword || body.newPassword.length < 6) {
        errors.push('New password must be at least 6 characters');
    }
    if(!body.confirmNewPassword) {
        errors.push('Confirm new password is required');
    }
    if(body.newPassword !== body.confirmNewPassword) {
        errors.push('New passwords do not match');
    }
    return { valid: errors.length === 0, errors };
}

function validateUserInput(body) {
    const errors = [];
    if(!body.username || body.username.trim() === '') {
        errors.push('Username is required');
    }
    if(!body.email || body.email.trim() === '') {
        errors.push('Email is required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(body.email && !emailRegex.test(body.email)) {
        errors.push('Invalid email format');
    }
    if(body.role && !['user', 'admin'].includes(body.role)) {
        errors.push('Role must be user or admin');
    }
    if(body.active && !['active', 'locked'].includes(body.active)) {
        errors.push('Status must be active or locked');
    }
    return { valid: errors.length === 0, errors };
}

module.exports = { validateRegisterInput, validateLoginInput, validateChangePasswordInput, validateUserInput };