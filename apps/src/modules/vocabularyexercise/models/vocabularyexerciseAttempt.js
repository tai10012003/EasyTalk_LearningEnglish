const { ObjectId } = require('mongodb');

class VocabularyExerciseAttempt {
    static buildDocument({ userId, vocabularyExerciseId, vocabularyExerciseContent }) {
        const now = new Date();
        const questions = Array.isArray(vocabularyExerciseContent?.questions) ? vocabularyExerciseContent.questions : [];
        return {
            userId: new ObjectId(userId),
            vocabularyExerciseId: new ObjectId(vocabularyExerciseId),
            vocabularyExerciseContent,
            status: "in-progress",
            answers: [],
            answeredCount: 0,
            correctCount: 0,
            totalQuestions: questions.length,
            score: 0,
            startedAt: now,
            completedAt: null,
            createdAt: now,
            updatedAt: now
        };
    }
}

module.exports = { VocabularyExerciseAttempt };
