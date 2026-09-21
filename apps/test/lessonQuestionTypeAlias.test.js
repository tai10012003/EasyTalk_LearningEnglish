const test = require("node:test");
const assert = require("node:assert/strict");
const { Grammar } = require("../src/modules/grammar/models/grammar");
const { Pronunciation } = require("../src/modules/pronunciation/models/pronunciation");
const { Story } = require("../src/modules/story/model/story");
const { Stage } = require("../src/modules/stage/models/stage");
const { GrammarExercise } = require("../src/modules/grammarexercise/models/grammarexercise");
const { VocabularyExercise } = require("../src/modules/vocabularyexercise/models/vocabularyexercise");

const fillInQuestion = {
    question: "She ... to school every day.",
    type: "fill-in-the-blank",
    correctAnswer: "goes",
    explanation: "",
    options: [],
};

test("lesson and exercise validators accept fill-in-the-blank question type", () => {
    assert.deepEqual(Grammar.validate({
        title: "Grammar",
        description: "Description",
        content: "Content",
        category: "basic",
        level: "A1",
        sort: 1,
        quizzes: [fillInQuestion],
    }), []);

    assert.deepEqual(Pronunciation.validate({
        title: "Pronunciation",
        description: "Description",
        content: "Content",
        category: "basic",
        level: "A1",
        sort: 1,
        quizzes: [fillInQuestion],
    }), []);

    assert.deepEqual(Story.validate({
        title: "Story",
        description: "Description",
        level: "A1",
        category: "Daily Life",
        sort: 1,
        content: [{
            en: "She goes to school every day.",
            vi: "Co ay di hoc moi ngay.",
            vocabulary: [],
            quiz: {
                question: fillInQuestion.question,
                type: fillInQuestion.type,
                answer: fillInQuestion.correctAnswer,
                explanation: "",
                options: [],
            },
        }],
    }), []);

    assert.deepEqual(Stage.validate({
        title: "Stage",
        gate: "670a250adcd67698aff1ce13",
        questions: [fillInQuestion],
    }), []);

    assert.deepEqual(GrammarExercise.validate({
        title: "Grammar exercise",
        questions: [fillInQuestion],
    }), []);

    assert.deepEqual(VocabularyExercise.validate({
        title: "Vocabulary exercise",
        questions: [fillInQuestion],
    }), []);
});
