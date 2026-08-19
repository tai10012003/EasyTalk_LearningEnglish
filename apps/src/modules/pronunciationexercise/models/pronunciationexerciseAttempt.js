const { ObjectId } = require('mongodb');

class PronunciationExerciseAttempt {
    static buildDocument({ userId, pronunciationExerciseId, pronunciationExerciseContent }) {
        const now = new Date();
        const questions = Array.isArray(pronunciationExerciseContent?.questions) ? pronunciationExerciseContent.questions : [];
        return {
            userId: new ObjectId(userId),
            pronunciationExerciseId: new ObjectId(pronunciationExerciseId),
            pronunciationExerciseContent,
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

module.exports = { PronunciationExerciseAttempt };
