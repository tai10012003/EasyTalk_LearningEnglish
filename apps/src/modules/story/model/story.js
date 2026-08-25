const { ObjectId } = require('mongodb');

class StoryQuiz {
    constructor({ question, type, answer, explanation = '', options = [] }) {
        this.question = question;
        this.type = type;
        this.answer = answer;
        this.explanation = explanation;
        this.options = type == 'multiple-choice' ? options : [];
    }

    static validate(quiz) {
        const errors = [];
        if(!quiz.question || quiz.question.trim() === '') {
            errors.push('Quiz question is required');
        }
        if(!quiz.type) {
            errors.push('Quiz type is required');
        }
        const validTypes = ['multiple-choice', 'true-false', 'fill-in-the-blank'];
        if(quiz.type && !validTypes.includes(quiz.type)) {
            errors.push(`Quiz type must be one of: ${validTypes.join(', ')}`);
        }
        if(!quiz.answer) {
            errors.push('Quiz answer is required');
        }
        if(quiz.type === 'multiple-choice' && (!quiz.options || quiz.options.length < 2)) {
            errors.push('Multiple choice quiz must have at least 2 options');
        }
        return errors;
    }
}

class StorySentence {
    constructor({ en, vi, vocabulary = [], quiz = null }) {
        this.en = en;
        this.vi = vi;
        this.vocabulary = vocabulary;
        this.quiz = quiz ? new StoryQuiz(quiz) : null;
    }

    addQuiz(question, type, answer, explanation = '', options = []) {
        this.quiz = new StoryQuiz({ question, type, answer, explanation, options });
    }

    static validate(sentence, index) {
        const errors = [];
        if(!sentence.en || sentence.en.trim() === '') {
            errors.push(`Sentence ${index + 1}: English text is required`);
        }
        if(!sentence.vi || sentence.vi.trim() === '') {
            errors.push(`Sentence ${index + 1}: Vietnamese text is required`);
        }
        if(sentence.vocabulary && !Array.isArray(sentence.vocabulary)) {
            errors.push(`Sentence ${index + 1}: Vocabulary must be an array`);
        }
        if(sentence.quiz) {
            const quizErrors = StoryQuiz.validate(sentence.quiz);
            if (quizErrors.length > 0) {
                errors.push(`Sentence ${index + 1} quiz: ${quizErrors.join(', ')}`);
            }
        }
        return errors;
    }
}

class Story {
    constructor({ _id = null, title, description, content = [], image = null, level, category, slug = "", sort = 0, display = true, createdAt = new Date(), updatedAt = null }) {
        this._id = _id;
        this.title = title;
        this.description = description;
        this.content = content.map(s => new StorySentence(s));
        this.image = image;
        this.level = level;
        this.category = category;
        this.slug = slug;
        this.sort = sort;
        this.display = display;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    addSentence(en, vi, vocabulary = []) {
        const sentence = new StorySentence({ en, vi, vocabulary, quiz: null });
        this.content.push(sentence);
        return sentence;
    }

    static validate(doc) {
        const errors = [];
        if(!doc.title || doc.title.trim() === '') {
            errors.push('Title is required');
        }
        if(!doc.level || doc.level.trim() === '') {
            errors.push('Level is required');
        }
        if(!doc.category || doc.category.trim() === '') {
            errors.push('Category is required');
        }
        if(!doc.content || !Array.isArray(doc.content) || doc.content.length === 0) {
            errors.push('Content must be a non-empty array');
        }
        if(doc.sort !== undefined && (typeof doc.sort !== 'number' || doc.sort < 0)) {
            errors.push('Sort must be a non-negative number');
        }
        if(doc.content && Array.isArray(doc.content)) {
            doc.content.forEach((sentence, index) => {
                const sentenceErrors = StorySentence.validate(sentence, index);
                if (sentenceErrors.length > 0) {
                    errors.push(...sentenceErrors);
                }
            });
        }
        return errors;
    }

    static buildDocument(data) {
        const content = (data.content || []).map(sentence => ({
            en: sentence.en,
            vi: sentence.vi,
            vocabulary: sentence.vocabulary || [],
            quiz: sentence.quiz
                ? {
                    question: sentence.quiz.question,
                    type: sentence.quiz.type,
                    answer: sentence.quiz.answer,
                    explanation: sentence.quiz.explanation || '',
                    options: sentence.quiz.options || []
                }
                : null
        }));
        return {
            title: data.title,
            description: data.description,
            level: data.level,
            category: data.category,
            image: data.image || null,
            content,
            slug: data.slug,
            sort: parseInt(data.sort) || 0,
            display: data.display !== undefined ? data.display : true,
            createdAt: new Date()
        };
    }
}

module.exports = { Story, StorySentence, StoryQuiz };
