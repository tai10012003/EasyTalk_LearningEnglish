function validateUserSettingUpdate(body) {
    const errors = [];
    if (body.interface) {
        if(body.interface.theme) {
            const validThemes = ['light', 'dark'];
            if(!validThemes.includes(body.interface.theme)) {
                errors.push('Theme must be light or dark');
            }
        }
        if(body.interface.fontSize !== undefined) {
            const size = parseInt(body.interface.fontSize);
            if(isNaN(size) || size < 10 || size > 24) {
                errors.push('Font size must be between 10 and 24');
            }
        }
    }
    return { valid: errors.length === 0, errors };
}

function validateSection(section) {
    const validSections = ['interface', 'general', 'security', 'notifications'];
    if(!validSections.includes(section)) {
        return {
            valid: false,
            error: 'Invalid setting section. Must be one of: interface, general, security, notifications'
        };
    }
    return { valid: true };
}

module.exports = { validateUserSettingUpdate, validateSection };