module.exports = [
    {
        name: "detect plural agreement in short writing",
        input: {
            userId: "eval-user",
            text: "People is happy when I am go to school.",
            modeConfig: { title: "Quick Correction" }
        },
        expectations: {
            minCorrections: 1,
            scoreMax: 8,
            requiresRewrite: true
        }
    },
    {
        name: "provide usable rewrite for clear paragraph",
        input: {
            userId: "eval-user",
            text: "I like learning English because it helps me talk with customers at work.",
            modeConfig: { title: "Paragraph Improvement" }
        },
        expectations: {
            minStrengths: 1,
            maxCorrections: 2,
            requiresRewrite: true,
            requiresRubricFields: ["grammar", "vocabulary", "coherence"]
        }
    },
    {
        name: "flag grammar and vocabulary issues without over-scoring",
        input: {
            userId: "eval-user",
            text: "People is very good and I am go market yesterday.",
            modeConfig: { title: "Grammar and Vocabulary" }
        },
        expectations: {
            minCorrections: 1,
            scoreMax: 8,
            requiresRubricFields: ["grammar", "vocabulary"]
        }
    }
];
