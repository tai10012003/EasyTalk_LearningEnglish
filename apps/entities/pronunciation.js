class PronunciationQuestion {
    question;
    type;
    correctAnswer;
    explanation;
    options = [];
}

class pronunciations {
    _id;
    title;
    description;
    category;
    level;
    content;
    images;
    quizzes = [];
    slug;
    sort;
    display;
    createdAt;

    addQuestion(question, type, correctAnswer, explanation, options = []) {
        const newQuestion = new PronunciationQuestion();
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