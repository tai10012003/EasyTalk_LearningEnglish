const { ObjectId } = require('mongodb');

class QuestionStage {
    constructor({ question, type, correctAnswer, explanation = "", options = [] }) {
        this.question = question;
        this.type = type;
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
        this.options = type == 'multiple-choice' ? options : [];
    }

    static validate(q) {
        const errors = [];
        if(!q.question || q.question.trim() === '') {
            errors.push('Question text is required');
        }
        if(!q.type) {
            errors.push('Question type is required');
        }
        const validTypes = ['multiple-choice', 'true-false', 'fill-in-the-blank'];
        if(q.type && !validTypes.includes(q.type)) {
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

class Stage {
    constructor({ _id = null, title, gate, questions = [], createdAt = new Date(), updatedAt = null }) {
        this._id = _id;
        this.title = title;
        this.gate = gate;
        this.questions = questions.map(q => new QuestionStage(q));
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    addQuestion(question, type, correctAnswer, explanation, options = []) {
        const q = new QuestionStage({ question, type, correctAnswer, explanation, options });
        this.questions.push(q);
    }

    static validate(doc) {
        const errors = [];
        if(!doc.title || doc.title.trim() === '') {
            errors.push('Title is required');
        }
        if(!doc.gate) {
            errors.push('Gate is required');
        }
        if(!doc.questions || !Array.isArray(doc.questions) || doc.questions.length === 0) {
            errors.push('At least one question is required');
        }
        if(doc.questions && Array.isArray(doc.questions)) {
            doc.questions.forEach((q, index) => {
                const qErrors = QuestionStage.validate(q);
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
            gate: new ObjectId(data.gate || data.gateId),
            questions,
            createdAt: new Date()
        };
    }
}

module.exports = { Stage, QuestionStage };
