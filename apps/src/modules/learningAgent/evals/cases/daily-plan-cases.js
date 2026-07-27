module.exports = [
    {
        name: "new learner receives a small starter plan",
        input: {
            progress: null,
            memory: null,
            options: { targetMinutes: 10 }
        },
        expectations: {
            mustIncludeTaskType: "flashcard",
            mustIncludeTaskTypeAny: ["chat"],
            exactTotalMinutes: 10,
            maxTasks: 3
        }
    },
    {
        name: "prioritize weak listening with available dictation",
        input: {
            progress: {
                streak: 2,
                dailyFlashcardGoal: 20,
                dailyFlashcardReviews: {},
                unlockedDictations: ["dictation-1"]
            },
            memory: {
                learningGoals: ["communication"],
                weakSkills: ["listening"],
                preferredTopics: ["travel"]
            },
            options: { targetMinutes: 20 }
        },
        expectations: {
            mustIncludeTaskType: "dictation",
            maxTotalMinutes: 20,
            noFabricatedProgress: true
        }
    },
    {
        name: "prioritize weak grammar when grammar is the known weak skill",
        input: {
            progress: {
                streak: 4,
                dailyFlashcardGoal: 20,
                dailyFlashcardReviews: {},
                unlockedDictations: ["dictation-1"],
                unlockedGrammarExercises: ["grammar-1"]
            },
            memory: {
                learningGoals: ["communication"],
                weakSkills: ["grammar"],
                preferredTopics: ["work"]
            },
            options: { targetMinutes: 20 }
        },
        expectations: {
            mustIncludeTaskType: "grammar_exercise",
            maxTotalMinutes: 20
        }
    },
    {
        name: "ten minute plan stays compact",
        input: {
            progress: {
                streak: 1,
                dailyFlashcardGoal: 20,
                dailyFlashcardReviews: {},
                unlockedDictations: ["dictation-1"],
                unlockedGrammarExercises: ["grammar-1"]
            },
            memory: { weakSkills: ["listening"], learningGoals: ["daily_habit"] },
            options: { targetMinutes: 10 }
        },
        expectations: {
            exactTotalMinutes: 10,
            maxTasks: 3
        }
    },
    {
        name: "ninety minute plan expands practice variety",
        input: {
            progress: {
                streak: 7,
                dailyFlashcardGoal: 20,
                dailyFlashcardReviews: {},
                unlockedDictations: ["dictation-1"],
                unlockedGrammarExercises: ["grammar-1"],
                unlockedPronunciationExercises: ["pronunciation-1"]
            },
            memory: {
                learningGoals: ["communication", "listening", "grammar"],
                weakSkills: ["listening", "grammar", "pronunciation"],
                preferredTopics: ["travel"]
            },
            options: { targetMinutes: 90 }
        },
        expectations: {
            exactTotalMinutes: 90,
            minTasks: 4,
            mustIncludeTaskType: "dictation",
            mustIncludeTaskTypeAny: ["grammar_exercise", "chat"]
        }
    }
];
