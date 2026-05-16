const { ObjectId } = require('mongodb');
const { DEFAULT_SETTINGS } = require('../utils/defaultSettings');

class UserSetting {
    constructor({ _id = null, user, interface: interfaceSettings, general, security, notifications }) {
        this._id = _id;
        this.user = user;
        this.interface = interfaceSettings || { ...DEFAULT_SETTINGS.interface };
        this.general = general || { ...DEFAULT_SETTINGS.general };
        this.security = security || { ...DEFAULT_SETTINGS.security };
        this.notifications = notifications || { ...DEFAULT_SETTINGS.notifications };
    }

    static validate(doc) {
        const errors = [];
        if(!doc.user) {
            errors.push('User is required');
        }
        if(doc.interface) {
            const validThemes = ['light', 'dark'];
            if(doc.interface.theme && !validThemes.includes(doc.interface.theme)) {
                errors.push('Theme must be light or dark');
            }
            if(doc.interface.fontSize && (doc.interface.fontSize < 10 || doc.interface.fontSize > 24)) {
                errors.push('Font size must be between 10 and 24');
            }
        }
        if(doc.general) {
            const validLanguages = ['vi', 'en'];
            if(doc.general.language && !validLanguages.includes(doc.general.language)) {
                errors.push('Language must be vi or en');
            }
        }
        return errors;
    }

    static buildDocument(userId, data = {}) {
        return {
            user: new ObjectId(userId),
            interface: data.interface || { ...DEFAULT_SETTINGS.interface },
            general: data.general || { ...DEFAULT_SETTINGS.general },
            security: data.security || { ...DEFAULT_SETTINGS.security },
            notifications: data.notifications || { ...DEFAULT_SETTINGS.notifications }
        };
    }

    static getSectionNames() {
        return ['interface', 'general', 'security', 'notifications'];
    }
}

module.exports = UserSetting;