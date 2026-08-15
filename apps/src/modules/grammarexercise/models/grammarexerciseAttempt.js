const { ObjectId } = require('mongodb');

class GrammarExerciseAttempt {
    static buildDocument({ userId, grammarExerciseId, grammarExerciseContent }) {
        const now = new Date();
        const questions = Array.isArray(grammarExerciseContent?.questions) ? grammarExerciseContent.questions : [];
        return {
            userId: new ObjectId(userId),
            grammarExerciseId: new ObjectId(grammarExerciseId),
            grammarExerciseContent,
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

module.exports = { GrammarExerciseAttempt };
