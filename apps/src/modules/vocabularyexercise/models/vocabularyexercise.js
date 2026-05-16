const { ObjectId } = require('mongodb');

class Question {
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
        const validTypes = ['multiple-choice', 'fill-in-blank'];
        if (q.type && !validTypes.includes(q.type)) {
            errors.push(`Question type must be one of: ${validTypes.join(', ')}`);
        }
        if(!q.correctAnswer) {
            errors.push('Correct answer is required');
        }
        if(q.type === 'multiple-choice' && (!q.options || q.options.length < 2)) {
            errors.push('Multiple choice questions must have at least 2 options');
        }
        return errors;
    }
}

class VocabularyExercise {
    constructor({ _id = null, title, questions = [], slug = "", sort = 0, display = true, createdAt = new Date(), updatedAt = null }) {
        this._id = _id;
        this.title = title;
        this.questions = questions.map(q => new Question(q));
        this.slug = slug;
        this.sort = sort;
        this.display = display;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    addQuestion(question, type, correctAnswer, explanation, options = []) {
        const q = new Question({ question, type, correctAnswer, explanation, options });
        this.questions.push(q);
    }

    static validate(doc) {
        const errors = [];
        if(!doc.title || doc.title.trim() === '') {
            errors.push('Title is required');
        }
        if(doc.sort !== undefined && (typeof doc.sort !== 'number' || doc.sort < 0)) {
            errors.push('Sort must be a non-negative number');
        }
        if(doc.questions && Array.isArray(doc.questions)) {
            doc.questions.forEach((q, index) => {
                const qErrors = Question.validate(q);
                if (qErrors.length > 0) {
                    errors.push(`Question ${index + 1}: ${qErrors.join(', ')}`);
                }
            });
        }
        return errors;
    }

    static buildDocument(data) {
        const questions = (data.questions || []).map(q => ({
            question: q.question,
            type: q.type,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || "",
            options: q.options || []
        }));
        return {
            title: data.title,
            questions,
            slug: data.slug,
            sort: parseInt(data.sort) || 0,
            display: data.display !== undefined ? data.display : true,
            createdAt: new Date()
        };
    }
}

module.exports = { VocabularyExercise, Question };