const { ObjectId } = require('mongodb');

class DictationExercise {
    constructor({ _id = null, title, description, content, slug = "", sort = 0, display = true, createdAt = new Date(), updatedAt = null }) {
        this._id = _id;
        this.title = title;
        this.description = description;
        this.content = content;
        this.slug = slug;
        this.sort = sort;
        this.display = display;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    static validate(doc) {
        const errors = [];
        if(!doc.title || doc.title.trim() === '') {
            errors.push('Title is required');
        }
        if(!doc.content || doc.content.trim() === '') {
            errors.push('Content is required');
        }
        if(doc.sort !== undefined && (typeof doc.sort !== 'number' || doc.sort < 0)) {
            errors.push('Sort must be a non-negative number');
        }
        return errors;
    }

    static buildDocument(data) {
        return {
            title: data.title,
            description: data.description || '',
            content: data.content,
            slug: data.slug,
            sort: parseInt(data.sort) || 0,
            display: data.display !== undefined ? data.display : true,
            createdAt: new Date()
        };
    }
}

module.exports = DictationExercise;