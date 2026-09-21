const test = require('node:test');
const assert = require('node:assert/strict');
const { ObjectId } = require('mongodb');
const GrammarExerciseService = require('../src/modules/grammarexercise/services/grammarexerciseService');

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

test('grammar exercise attempt checks answers against saved content', async () => {
    const userId = new ObjectId();
    const grammarExerciseId = new ObjectId();
    const grammarExercise = {
        _id: grammarExerciseId,
        title: "Bộ đề ngữ pháp 1",
        slug: "bo-de-ngu-phap-1",
        questions: [
            {
                question: "He usually ...... at 7 a.m.",
                type: "multiple-choice",
                options: ["wake up", "wakes up"],
                correctAnswer: "wakes up",
                explanation: "Ngôi thứ ba số ít cần thêm s."
            }
        ]
    };
    const repository = {
        async findById() {
            return grammarExercise;
        }
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return { unlockedGrammarExercises: [grammarExerciseId] };
        }
    };
    const service = new GrammarExerciseService({
        repository,
        attemptRepository: createMemoryAttemptRepository(),
        userProgressService
    });

    const startResult = await service.startAttempt(userId, grammarExerciseId);
    assert.equal(startResult.status, 201);
    assert.equal(startResult.data.questions[0].correctAnswer, undefined);

    grammarExercise.questions[0].correctAnswer = "wake up";
    grammarExercise.questions[0].explanation = "Đáp án gốc đã bị sửa sau khi bắt đầu.";

    const checkResult = await service.checkAttemptQuestion(
        userId,
        startResult.data.attemptId,
        0,
        "wakes up"
    );

    assert.equal(checkResult.status, 200);
    assert.equal(checkResult.data.isCorrect, true);
    assert.equal(checkResult.data.correctAnswer, "wakes up");
    assert.equal(checkResult.data.explanation, "Ngôi thứ ba số ít cần thêm s.");
    assert.equal(checkResult.data.correctCount, 1);
});

test('grammar exercise roadmap returns compact unlock state', async () => {
    const userId = new ObjectId();
    const firstExerciseId = new ObjectId();
    const secondExerciseId = new ObjectId();
    const exercises = [
        {
            _id: firstExerciseId,
            title: "Bộ đề ngữ pháp 1",
            slug: "bo-de-ngu-phap-1",
            sort: 1,
            questions: [{ question: "Q1" }, { question: "Q2" }]
        },
        {
            _id: secondExerciseId,
            title: "Bộ đề ngữ pháp 2",
            slug: "bo-de-ngu-phap-2",
            sort: 2,
            questions: [{ question: "Q1" }]
        }
    ];
    const repository = {
        async findAll() {
            return { exercises, total: exercises.length };
        }
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return { unlockedGrammarExercises: [firstExerciseId] };
        }
    };
    const service = new GrammarExerciseService({
        repository,
        attemptRepository: createMemoryAttemptRepository(),
        userProgressService
    });

    const result = await service.getGrammarExerciseRoadmap(userId);

    assert.equal(result.status, 200);
    assert.equal(result.data.data.items.length, 2);
    assert.equal(result.data.data.items[0].isUnlocked, true);
    assert.equal(result.data.data.items[0].isCurrent, true);
    assert.equal(result.data.data.items[0].questionCount, 2);
    assert.equal(result.data.data.items[0].questions, undefined);
    assert.equal(result.data.data.items[1].isUnlocked, false);
    assert.deepEqual(result.data.data.progress, {
        unlockedCount: 1,
        totalCount: 2,
        percent: 50
    });
});

test('grammar exercise attempt history returns list and detail for owner', async () => {
    const userId = new ObjectId();
    const grammarExerciseId = new ObjectId();
    const attemptRepository = createMemoryAttemptRepository();
    const repository = {
        async findById() {
            return {
                _id: grammarExerciseId,
                title: "Bộ đề ngữ pháp 1",
                slug: "bo-de-ngu-phap-1",
                questions: [
                    {
                        question: "He usually ...... at 7 a.m.",
                        type: "multiple-choice",
                        options: ["wake up", "wakes up"],
                        correctAnswer: "wakes up",
                        explanation: "Ngôi thứ ba số ít cần thêm s."
                    }
                ]
            };
        }
    };
    const userProgressService = {
        async getUserProgressByUserId() {
            return { unlockedGrammarExercises: [grammarExerciseId] };
        }
    };
    const service = new GrammarExerciseService({
        repository,
        attemptRepository,
        userProgressService
    });

    const startResult = await service.startAttempt(userId, grammarExerciseId);
    await service.checkAttemptQuestion(userId, startResult.data.attemptId, 0, "wakes up");
    await service.finishAttempt(userId, startResult.data.attemptId);

    const history = await service.getAttemptHistory(userId, 1, 10);
    assert.equal(history.status, 200);
    assert.equal(history.data.data.items.length, 1);
    assert.equal(history.data.data.items[0].title, "Bộ đề ngữ pháp 1");
    assert.equal(history.data.data.items[0].correctCount, 1);

    const detail = await service.getAttemptDetail(userId, startResult.data.attemptId);
    assert.equal(detail.status, 200);
    assert.equal(detail.data.data.questionResults.length, 1);
    assert.equal(detail.data.data.questionResults[0].userAnswer, "wakes up");
    assert.equal(detail.data.data.questionResults[0].isCorrect, true);

    const deleted = await service.deleteAttemptHistory(userId, startResult.data.attemptId);
    assert.equal(deleted.status, 200);

    const afterDelete = await service.getAttemptHistory(userId, 1, 10);
    assert.equal(afterDelete.data.data.items.length, 0);
});
