class GrammarQuestion {
    constructor({ question, type, correctAnswer, explanation = "", options = [] }) {
        this.question = question;
        this.type = type;
        this.correctAnswer = correctAnswer;
        this.explanation = explanation;
        this.options = type == "multiple-choice" ? options : [];
    }
}

class Grammar {
    constructor({ _id = null, title, description, content, images = "", quizzes = [], createdAt = new Date() }) {
        this._id = _id;
        this.title = title;
        this.description = description;
        this.content = content;
        this.images = images;
        this.quizzes = quizzes.map(q => new GrammarQuestion(q));
        this.createdAt = createdAt;
    }

    addQuestion(questionObj) {
        const q = new GrammarQuestion(questionObj);
        this.quizzes.push(q);
    }
}

module.exports = { Grammar, GrammarQuestion };