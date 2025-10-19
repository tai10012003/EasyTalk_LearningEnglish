class QuestionStage {
    question;
    type;
    correctAnswer;
    explanation;
    options = [];
}

class Stage {
    _id;
    title;
    gate;
    createdAt = new Date();
    questions = [];


    addQuestion(question, type, correctAnswer, explanation, options = []) {
        const newQuestion = new QuestionStage();
        newQuestion.question = question;
        newQuestion.type = type;
        newQuestion.correctAnswer = correctAnswer;
        newQuestion.explanation = explanation;
        newQuestion.options = type == 'multiple-choice' ? options : [];
        this.questions.push(newQuestion);
    }
    constructor() {
        
    }
}

module.exports = Stage;
