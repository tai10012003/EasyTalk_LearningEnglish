class GrammarQuestion {
    question;
    type;
    correctAnswer;
    explanation;
    options = [];
}

class grammars {
    _id;
    title;
    description;
    content;
    images;
    quizzes = [];
    createdAt;

    addQuestion(question, type, correctAnswer, explanation, options = []) {
        const newQuestion = new GrammarQuestion();
        newQuestion.question = question;
        newQuestion.type = type;
        newQuestion.correctAnswer = correctAnswer;
        newQuestion.explanation = explanation;
        newQuestion.options = type == 'multiple-choice' ? options : [];
        this.quizzes.push(newQuestion);
    }
    constructor() {

    }
}
