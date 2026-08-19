const test = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const PronunciationExerciseService = require('../src/modules/pronunciationexercise/services/pronunciationexerciseService');

function createMemoryAttemptRepository() {
    const attempts = new Map();
    return {
        async insert(document) {
            const _id = new ObjectId();
            attempts.set(_id.toString(), { ...document, _id });
            return { insertedId: _id };
        },
        async findById(id) {
            return attempts.get(id.toString()) || null;
        },
        async deleteById(id, userId) {
            const attempt = attempts.get(id.toString());
            if (!attempt || attempt.userId.toString() !== userId.toString()) {
                return { deletedCount: 0 };
            }
            attempts.delete(id.toString());
            return { deletedCount: 1 };
        },
        async findHistoryByUser(userId, page = 1, limit = 10) {
            const userAttempts = [...attempts.values()]
                .filter(attempt => attempt.userId.toString() === userId.toString())
                .sort((a, b) => b.createdAt - a.createdAt);
            const skip = (page - 1) * limit;
            return {
                items: userAttempts.slice(skip, skip + limit),
                total: userAttempts.length
            };
        },
        async updateAnswer(attemptId, answers, summary) {
            const attempt = attempts.get(attemptId.toString());
            attempts.set(attemptId.toString(), {
                ...attempt,
                answers,
                ...summary,
                updatedAt: new Date()
            });
            return { modifiedCount: 1 };
        },
        async finish(attemptId, summary) {
            const attempt = attempts.get(attemptId.toString());
            attempts.set(attemptId.toString(), {
                ...attempt,
                ...summary,
                status: "completed",
                completedAt: new Date(),
                updatedAt: new Date()
            });
            return { modifiedCount: 1 };
        }
    };
}

const passthroughCache = {
    async getOrSet(_key, _policy, fetcher) {
        return await fetcher();
    }
};

test('pronunciation exercise attempt analyzes against saved content', async () => {
    const userId = new ObjectId();
    const pronunciationExerciseId = new ObjectId();
    const pronunciationExercise = {
        _id: pronunciationExerciseId,
        title: "Bộ đề phát âm 1",
        slug: "bo-de-phat-am-1",
        questions: [
            {
                question: "Good morning",
                type: "pronunciation",
                options: [],
                correctAnswer: "Good morning",
                explanation: "Phát âm rõ từng từ."
            }
        ]
    };
    const repository = {
        async findById() {
            return pronunciationExercise;
        }
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return { unlockedPronunciationExercises: [pronunciationExerciseId] };
        }
    };
    const speechAnalysisService = {
        async analyzeWithExercise(_audioBuffer, exercise, questionIndex) {
            return {
                success: true,
                transcription: "Good morning",
                correctAnswer: exercise.questions[questionIndex].correctAnswer,
                questionIndex
            };
        }
    };
    const service = new PronunciationExerciseService({
        repository,
        attemptRepository: createMemoryAttemptRepository(),
        userProgressService,
        speechAnalysisService,
        cacheService: passthroughCache
    });

    const startResult = await service.startAttempt(userId, pronunciationExerciseId);
    assert.equal(startResult.status, 201);
    assert.equal(startResult.data.questions[0].correctAnswer, undefined);

    pronunciationExercise.questions[0].correctAnswer = "Changed answer";

    const analyzeResult = await service.analyzeAttemptQuestion(
        Buffer.from("audio"),
        userId,
        startResult.data.attemptId,
        0
    );

    assert.equal(analyzeResult.status, 200);
    assert.equal(analyzeResult.data.isCorrect, true);
    assert.equal(analyzeResult.data.correctAnswer, "Good morning");
    assert.equal(analyzeResult.data.correctCount, 1);
});

test('pronunciation exercise roadmap and history are compact and user scoped', async () => {
    const userId = new ObjectId();
    const firstExerciseId = new ObjectId();
    const secondExerciseId = new ObjectId();
    const exercises = [
        {
            _id: firstExerciseId,
            title: "Bộ đề phát âm 1",
            slug: "bo-de-phat-am-1",
            sort: 1,
            questions: [{ question: "Q1" }, { question: "Q2" }]
        },
        {
            _id: secondExerciseId,
            title: "Bộ đề phát âm 2",
            slug: "bo-de-phat-am-2",
            sort: 2,
            questions: [{ question: "Q1" }]
        }
    ];
    const repository = {
        async findAll() {
            return { exercises, total: exercises.length };
        },
        async findById() {
            return {
                ...exercises[0],
                questions: [
                    {
                        question: "Choose the correct sentence",
                        type: "multiple-choice",
                        options: ["Good morning", "Good night"],
                        correctAnswer: "Good morning",
                        explanation: "Morning là buổi sáng."
                    }
                ]
            };
        }
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return { unlockedPronunciationExercises: [firstExerciseId] };
        }
    };
    const service = new PronunciationExerciseService({
        repository,
        attemptRepository: createMemoryAttemptRepository(),
        userProgressService,
        cacheService: passthroughCache
    });

    const roadmap = await service.getPronunciationExerciseRoadmap(userId);
    assert.equal(roadmap.data.data.items[0].isUnlocked, true);
    assert.equal(roadmap.data.data.items[0].isCurrent, true);
    assert.equal(roadmap.data.data.items[0].questions, undefined);
    assert.equal(roadmap.data.data.progress.percent, 50);

    const startResult = await service.startAttempt(userId, firstExerciseId);
    await service.checkAttemptQuestion(userId, startResult.data.attemptId, 0, "Good morning");
    await service.finishAttempt(userId, startResult.data.attemptId);

    const history = await service.getAttemptHistory(userId, 1, 10);
    assert.equal(history.data.data.items.length, 1);
    assert.equal(history.data.data.items[0].correctCount, 1);

    const detail = await service.getAttemptDetail(userId, startResult.data.attemptId);
    assert.equal(detail.data.data.questionResults[0].userAnswer, "Good morning");
    assert.equal(detail.data.data.questionResults[0].isCorrect, true);

    const deleted = await service.deleteAttemptHistory(userId, startResult.data.attemptId);
    assert.equal(deleted.status, 200);
});
