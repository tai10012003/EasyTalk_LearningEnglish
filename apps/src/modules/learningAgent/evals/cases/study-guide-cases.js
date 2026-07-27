module.exports = [
    {
        name: "coach guide includes time task and memory steps",
        input: {
            userId: "eval-user",
            targetMinutes: 30,
            dailyPlan: {
                tasks: [
                    {
                        type: "flashcard",
                        title: "Ôn 10 flashcard hôm nay",
                        estimatedMinutes: 10,
                        priority: "high",
                        action: { label: "Ôn ngay", path: "/flashcard" }
                    },
                    {
                        type: "dictation",
                        title: "Tập trung nghe chủ động",
                        estimatedMinutes: 12,
                        priority: "high",
                        action: { label: "Luyện nghe", path: "/dictation-exercise" }
                    }
                ]
            },
            memory: {
                weakSkills: ["listening"],
                memoryVersion: "learner-memory-v1"
            }
        },
        expectations: {
            targetMinutes: 30,
            mustIncludeStepTypes: ["time_setup", "daily_plan_task", "memory_profile"],
            mustRecommendFirstPath: "/flashcard"
        }
    }
];
