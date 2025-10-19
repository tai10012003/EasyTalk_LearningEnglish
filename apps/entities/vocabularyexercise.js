class VocabularyQuestion {
    question;
    type;
    correctAnswer;
    explanation;
    options = [];
}

class VocabularyExercise {
    _id;
    title;
    createdAt;
    questions = [];


    addQuestion(question, type, correctAnswer, explanation, options = []) {
        const newQuestion = new VocabularyQuestion();
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

module.exports = VocabularyExercise;
