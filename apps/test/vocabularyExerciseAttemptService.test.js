const test = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const VocabularyExerciseService = require('../src/modules/vocabularyexercise/services/vocabularyexerciseService');

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

test('vocabulary exercise attempt checks answers against saved content', async () => {
    const userId = new ObjectId();
    const vocabularyExerciseId = new ObjectId();
    const vocabularyExercise = {
        _id: vocabularyExerciseId,
        title: "Bộ đề từ vựng 1",
        slug: "bo-de-tu-vung-1",
        questions: [
            {
                question: "Apple means ......",
                type: "multiple-choice",
                options: ["quả táo", "quả cam"],
                correctAnswer: "quả táo",
                explanation: "Apple nghĩa là quả táo."
            }
        ]
    };
    const repository = {
        async findById() {
            return vocabularyExercise;
        }
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return { unlockedVocabularyExercises: [vocabularyExerciseId] };
        }
    };
    const service = new VocabularyExerciseService({
        repository,
        attemptRepository: createMemoryAttemptRepository(),
        userProgressService
    });

    const startResult = await service.startAttempt(userId, vocabularyExerciseId);
    assert.equal(startResult.status, 201);
    assert.equal(startResult.data.questions[0].correctAnswer, undefined);

    vocabularyExercise.questions[0].correctAnswer = "quả cam";

    const checkResult = await service.checkAttemptQuestion(
        userId,
        startResult.data.attemptId,
        0,
        "quả táo"
    );

    assert.equal(checkResult.status, 200);
    assert.equal(checkResult.data.isCorrect, true);
    assert.equal(checkResult.data.correctAnswer, "quả táo");
    assert.equal(checkResult.data.correctCount, 1);
});

test('vocabulary exercise roadmap and history are compact and user scoped', async () => {
    const userId = new ObjectId();
    const firstExerciseId = new ObjectId();
    const secondExerciseId = new ObjectId();
    const exercises = [
        {
            _id: firstExerciseId,
            title: "Bộ đề từ vựng 1",
            slug: "bo-de-tu-vung-1",
            sort: 1,
            questions: [{ question: "Q1" }, { question: "Q2" }]
        },
        {
            _id: secondExerciseId,
            title: "Bộ đề từ vựng 2",
            slug: "bo-de-tu-vung-2",
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
                        question: "Apple means ......",
                        type: "multiple-choice",
                        options: ["quả táo", "quả cam"],
                        correctAnswer: "quả táo",
                        explanation: "Apple nghĩa là quả táo."
                    }
                ]
            };
        }
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return { unlockedVocabularyExercises: [firstExerciseId] };
        }
    };
    const service = new VocabularyExerciseService({
        repository,
        attemptRepository: createMemoryAttemptRepository(),
        userProgressService
    });

    const roadmap = await service.getVocabularyExerciseRoadmap(userId);
    assert.equal(roadmap.data.data.items[0].isUnlocked, true);
    assert.equal(roadmap.data.data.items[0].isCurrent, true);
    assert.equal(roadmap.data.data.items[0].questions, undefined);
    assert.equal(roadmap.data.data.progress.percent, 50);

    const startResult = await service.startAttempt(userId, firstExerciseId);
    await service.checkAttemptQuestion(userId, startResult.data.attemptId, 0, "quả táo");
    await service.finishAttempt(userId, startResult.data.attemptId);

    const history = await service.getAttemptHistory(userId, 1, 10);
    assert.equal(history.data.data.items.length, 1);
    assert.equal(history.data.data.items[0].correctCount, 1);

    const detail = await service.getAttemptDetail(userId, startResult.data.attemptId);
    assert.equal(detail.data.data.questionResults[0].userAnswer, "quả táo");
    assert.equal(detail.data.data.questionResults[0].isCorrect, true);

    const deleted = await service.deleteAttemptHistory(userId, startResult.data.attemptId);
    assert.equal(deleted.status, 200);
});
