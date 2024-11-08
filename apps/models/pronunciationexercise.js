class PronunciationQuestion {
    question;
    type; // 'multiple-choice', 'fill-in-the-blank', 'translation'
    correctAnswer;
    options = []; // Chỉ khi loại là multiple-choice mới có options
    explanation;
}

class PronunciationExercise {
    _id;
    title;
    createdAt = new Date(); // Tự động gán ngày tạo
    questions = []; // Mảng các câu hỏi


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
