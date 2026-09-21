const { ObjectId } = require('mongodb');

class Reminder {
    constructor({ _id = null, user, email, reminderTime, frequency = 'one-time', status = 'active', additionalInfo = '' }) {
        this._id = _id;
        this.user = user;
        this.email = email;
        this.reminderTime = reminderTime;
        this.frequency = frequency;
        this.status = status;
        this.additionalInfo = additionalInfo;
    }

    static validate(doc) {
        const errors = [];
        if(!doc.user) {
            errors.push('User is required');
        }
        if(!doc.email || doc.email.trim() === '') {
            errors.push('Email is required');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(doc.email && !emailRegex.test(doc.email)) {
            errors.push('Invalid email format');
        }
        if(!doc.reminderTime) {
            errors.push('Reminder time is required');
        }
        const validFrequencies = ['one-time', 'daily', 'weekly', 'monthly'];
        if(doc.frequency && !validFrequencies.includes(doc.frequency.toLowerCase())) {
            errors.push(`Frequency must be one of: ${validFrequencies.join(', ')}`);
        }
        const validStatuses = ['active', 'completed'];
        if(doc.status && !validStatuses.includes(doc.status)) {
            errors.push('Status must be active or completed');
        }
        return errors;
    }

    static buildDocument(data, userId) {
        return {
            user: new ObjectId(userId),
            email: data.email,
            reminderTime: data.reminderTime,
            frequency: data.frequency || 'one-time',
            status: data.status || 'active',
            additionalInfo: data.additionalInfo || ''
        };
    }

    isOneTime() {
        return !this.frequency || this.frequency.toLowerCase() === 'one-time';
    }

    isActive() {
        return this.status === 'active';
    }
}

module.exports = Reminder;