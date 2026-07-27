module.exports = [
    {
        name: "correct gently and ask one follow-up",
        input: {
            userId: "eval-user",
            message: "I am go to airport",
            memory: {
                weakSkills: ["grammar", "speaking"],
                preferredTopics: ["travel"]
            },
            session: {
                topic: "travel",
                messages: []
            },
            isFirstTurn: false
        },
        expectations: {
            maxCorrections: 3,
            shouldDetect: "I am go"
        }
    },
    {
        name: "avoid heavy correction when message is acceptable",
        input: {
            userId: "eval-user",
            message: "I studied English after work and it was interesting.",
            memory: {
                weakSkills: ["speaking"],
                preferredTopics: ["work"]
            },
            session: {
                topic: "work",
                messages: []
            },
            isFirstTurn: false
        },
        expectations: {
            maxCorrections: 1,
            shouldNotFabricateProgress: true
        }
    },
    {
        name: "first turn should not claim completed lessons",
        input: {
            userId: "eval-user",
            message: "",
            memory: {
                weakSkills: ["speaking"],
                preferredTopics: ["travel"]
            },
            session: {
                topic: "travel",
                messages: []
            },
            dailyPlan: { tasks: [] },
            isFirstTurn: true
        },
        expectations: {
            maxCorrections: 0,
            shouldNotFabricateProgress: true
        }
    }
];
