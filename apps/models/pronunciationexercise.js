class PronunciationQuestion {
    question;
    type;
    correctAnswer;
    options = [];
    explanation;
}

class PronunciationExercise {
    _id;
    title;
    createdAt = new Date();
    questions = [];


    addQuestion(question, type, correctAnswer, explanation, options = []) {
        const newQuestion = new PronunciationQuestion();
        newQuestion.question = question;
        newQuestion.type = type;
        newQuestion.correctAnswer = correctAnswer;
        newQuestion.explanation = explanation;
        newQuestion.options = type === 'multiple-choice' ? options : [];
        this.questions.push(newQuestion);
    }
    constructor() {
        
    }
}

module.exports = PronunciationExercise;
