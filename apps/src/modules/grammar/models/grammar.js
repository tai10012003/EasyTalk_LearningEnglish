const { ObjectId } = require('mongodb');

class GrammarQuestion {
    constructor({ question, type, correctAnswer, explanation = "", options = [] }) {
        this.question = question;
        this.type = type;
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
        this.options = type == "multiple-choice" ? options : [];
    }

    static validate(q) {
        const errors = [];
        if (!q.question || q.question.trim() === '') {
            errors.push('Question text is required');
        }
        if (!q.type) {
            errors.push('Question type is required');
        }
        const validTypes = ['multiple-choice', 'true-false', 'fill-in-blank'];
        if (q.type && !validTypes.includes(q.type)) {
            errors.push(`Question type must be one of: ${validTypes.join(', ')}`);
        }
        if (!q.correctAnswer) {
            errors.push('Correct answer is required');
        }
        if (q.type === 'multiple-choice' && (!q.options || q.options.length < 2)) {
            errors.push('Multiple choice questions must have at least 2 options');
        }
        return errors;
    }
}

class Grammar {
    constructor({ _id = null, title, description, content, category, level, images = "", quizzes = [], slug = "", sort = 0, display = true, createdAt = new Date(), updatedAt = null }) {
        this._id = _id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.level = level;
        this.content = content;
        this.images = images;
        this.quizzes = quizzes.map(q => new GrammarQuestion(q));
        this.slug = slug;
        this.sort = sort;
        this.display = display;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    addQuestion(questionObj) {
        const q = new GrammarQuestion(questionObj);
        this.quizzes.push(q);
    }

    static validate(doc) {
        const errors = [];
        if (!doc.title || doc.title.trim() === '') {
            errors.push('Title is required');
        }
        if (!doc.description || doc.description.trim() === '') {
            errors.push('Description is required');
        }
        if (!doc.content || doc.content.trim() === '') {
            errors.push('Content is required');
        }
        if (!doc.category || doc.category.trim() === '') {
            errors.push('Category is required');
        }
        if (!doc.level || doc.level.trim() === '') {
            errors.push('Level is required');
        }
        if (doc.sort !== undefined && (typeof doc.sort !== 'number' || doc.sort < 0)) {
            errors.push('Sort must be a non-negative number');
        }
        if (doc.quizzes && Array.isArray(doc.quizzes)) {
            doc.quizzes.forEach((q, index) => {
                const qErrors = GrammarQuestion.validate(q);
                if (qErrors.length > 0) {
                    errors.push(`Question ${index + 1}: ${qErrors.join(', ')}`);
                }
            });
        }
        return errors;
    }

    static buildDocument(data) {
        const quizzes = (data.quizzes || []).map(q => ({
            question: q.question,
            type: q.type,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            options: q.options || []
        }));
        return {
            title: data.title,
            description: data.description,
            category: data.category,
            level: data.level,
            content: data.content,
            images: data.images || null,
            quizzes,
            slug: data.slug,
            sort: parseInt(data.sort) || 0,
            display: data.display !== undefined ? data.display : true,
            createdAt: new Date()
        };
    }
}

module.exports = { Grammar, GrammarQuestion };