module.exports = [
    {
        name: "returning learner guide includes time task and memory refresh",
        input: {
            userId: "eval-user",
            targetMinutes: 30,
            dailyPlan: {
                learnerSnapshot: {
                    experiencePoints: 200,
                    maxStreak: 5,
                    studyMinutesToday: 8
                },
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
                proficiencyLevel: "beginner",
                learningGoals: ["ai_chat"],
                weakSkills: ["listening"],
                preferredTopics: ["travel"],
                memoryVersion: "learner-memory-v1",
                updatedAt: new Date("2026-07-01T00:00:00.000Z")
            }
        },
        expectations: {
            targetMinutes: 30,
            timeStepRecommendedMinutes: 20,
            mustIncludeStepTypes: ["time_setup", "daily_plan_task", "memory_profile"],
            mustRecommendFirstPath: "/flashcard"
        }
    },
    {
        name: "new learner guide starts with quick profile setup",
        input: {
            userId: "eval-new-user",
            targetMinutes: 10,
            dailyPlan: {
                learnerSnapshot: {
                    experiencePoints: 0,
                    maxStreak: 0,
                    studyMinutesToday: 0,
                    todayFlashcardReviews: 0
                },
                tasks: [
                    {
                        type: "chat",
                        title: "Nói chuyện với AI hôm nay",
                        estimatedMinutes: 3,
                        priority: "high",
                        action: { label: "Bắt đầu chat", path: "/chat" }
                    }
                ]
            },
            memory: {
                proficiencyLevel: "beginner",
                learningGoals: ["learning_journey", "ai_chat"],
                weakSkills: [],
                preferredTopics: [],
                memoryVersion: "learner-memory-v1"
            }
        },
        expectations: {
            targetMinutes: 20,
            recommendedFlow: "new_learner_onboarding",
            firstStepType: "new_learner_profile",
            mustIncludeStepTypes: ["new_learner_profile", "time_setup", "daily_plan_task"],
            mustExcludeStepTypes: ["memory_profile"],
            mustRecommendFirstPath: "/chat"
        }
    }
];
