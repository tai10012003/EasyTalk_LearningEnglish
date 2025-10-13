class StoryQuiz {
    question;
    type;
    answer;
    explanation;
    options = [];

    constructor(question, type, answer, explanation = '', options = []) {
        this.question = question;
        this.type = type;
        this.answer = answer;
        this.explanation = explanation;
        this.options = type == 'multiple-choice' ? options : [];
    }
}

class StorySentence {
    en;
    vi;
    vocabulary = [];
    quiz = null;

    constructor(en, vi, vocabulary = [], quiz = null) {
        this.en = en;
        this.vi = vi;
        this.vocabulary = vocabulary;
        this.quiz = quiz;
    }

    addQuiz(question, type, answer, explanation = '', options = []) {
        this.quiz = new StoryQuiz(question, type, answer, explanation, options);
    }
}

class Story {
    _id;
    title;
    description;
    content = [];
    image;
    level;
    category;
    createdAt;

    constructor(title, description, level, category, image) {
        this.title = title;
        this.description = description;
        this.level = level;
        this.category = category;
        this.image = image;
    }

    addSentence(en, vi, vocabulary = []) {
        const sentence = new StorySentence(en, vi, vocabulary, null);
        this.content.push(sentence);
        return sentence;
    }
}

module.exports = Story;