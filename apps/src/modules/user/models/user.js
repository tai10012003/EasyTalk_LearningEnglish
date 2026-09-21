const { ObjectId } = require('mongodb');

class User {
    constructor({ _id = null, username, email, password, role = 'user', active = 'active', facebookId = null, tokenVersion = 0, createdAt = new Date(), lastActive = new Date() }) {
        this._id = _id;
        this.username = username;
        this.email = email;
        this.password = password;
        this.role = role;
        this.active = active;
        this.facebookId = facebookId;
        this.tokenVersion = tokenVersion;
        this.createdAt = createdAt;
        this.lastActive = lastActive;
    }

    static validate(doc) {
        const errors = [];
        if(!doc.username || doc.username.trim() === '') {
            errors.push('Username is required');
        }
        if(!doc.email || doc.email.trim() === '') {
            errors.push('Email is required');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(doc.email && !emailRegex.test(doc.email)) {
            errors.push('Invalid email format');
        }
        if(!doc.password || doc.password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        const validRoles = ['user', 'admin'];
        if(doc.role && !validRoles.includes(doc.role)) {
            errors.push('Role must be user or admin');
        }
        const validStatuses = ['active', 'locked'];
        if(doc.active && !validStatuses.includes(doc.active)) {
            errors.push('Status must be active or locked');
        }
        return errors;
    }

    static buildDocument(data, hashedPassword) {
        return {
            username: data.username,
            email: data.email,
            password: hashedPassword,
            role: data.role || 'user',
            active: data.active || 'active',
            facebookId: data.facebookId || null,
            tokenVersion: 0,
            createdAt: new Date(),
            lastActive: new Date()
        };
    }
    isLocked() {
        return this.active === 'locked';
    }
    isAdmin() {
        return this.role === 'admin';
    }
}

module.exports = User;