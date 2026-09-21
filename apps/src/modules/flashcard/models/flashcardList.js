const { ObjectId } = require('mongodb');

class FlashcardList {
    constructor({ _id = null, name, description, user, createdAt = new Date() }) {
        this._id = _id;
        this.name = name;
        this.description = description;
        this.user = user;
        this.createdAt = createdAt;
    }

    static validate(doc) {
        const errors = [];
        if(!doc.name || doc.name.trim() === '') {
            errors.push('Name is required');
        }
        if(!doc.description || doc.description.trim() === '') {
            errors.push('Description is required');
        }
        if(!doc.user) {
            errors.push('User is required');
        }
        return errors;
    }

    static buildDocument(data, userId) {
        return {
            name: data.name,
            description: data.description,
            user: new ObjectId(userId),
            createdAt: new Date()
        };
    }
}

module.exports = FlashcardList;