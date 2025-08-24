class StoryQuiz {
    question;
    type;
    correctAnswer;
    explanation;
    options = [];

    constructor(question, type, correctAnswer, explanation = '', options = []) {
        this.question = question;
        this.type = type;
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
        this.options = type === 'multiple-choice' ? options : [];
    }
}

class StorySentence {
    en;
    vi;
    vocabulary = [];
    quiz = null;

    constructor(en, vi, vocabulary = [], quiz = null, audioUrl = '') {
        this.en = en;
        this.vi = vi;
        this.vocabulary = vocabulary;
        this.quiz = quiz;
        this.audioUrl = audioUrl;
    }

    addQuiz(question, type, correctAnswer, explanation = '', options = []) {
        this.quiz = new StoryQuiz(question, type, correctAnswer, explanation, options);
    }
}

class Story {
    _id;
    title;
    description;
    content = [];
    images;
    level;
    category;
    createdAt;

    constructor(title, description, level, category, images) {
        this.title = title;
        this.description = description;
        this.level = level;
        this.category = category;
        this.images = images;
    }

    addSentence(en, vi, vocabulary = []) {
        const sentence = new StorySentence(en, vi, vocabulary, null);
        this.content.push(sentence);
        return sentence;
    }
}

module.exports = Story;