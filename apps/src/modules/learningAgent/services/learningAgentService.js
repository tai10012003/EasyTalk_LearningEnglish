const { getVietnamDate } = require('../../../shared/utils/dateFormat');

const DEFAULT_TARGET_MINUTES = 10;
const MAX_TARGET_MINUTES = 120;
const MIN_TASK_MINUTES = 3;

class LearningAgentService {
    constructor(deps = {}) {
        this.userProgressService = deps.userProgressService || null;
        this.learnerMemoryService = deps.learnerMemoryService || null;
        this.aiProviderService = deps.aiProviderService || null;
    }

    setUserProgressService(service) {
        this.userProgressService = service;
    }

    setLearnerMemoryService(service) {
        this.learnerMemoryService = service;
    }

    setAIProviderService(service) {
        this.aiProviderService = service;
    }

    async getDailyPlan(userId, options = {}) {
        if (!this.userProgressService) {
            throw new Error("UserProgressService chưa được inject!");
        }

        const [progress, memory] = await Promise.all([
            this.userProgressService.getUserProgressByUserId(userId),
            this.learnerMemoryService ? this.learnerMemoryService.getOrCreateMemory(userId) : null
        ]);
        const targetMinutes = this.normalizeTargetMinutes(options.targetMinutes);
        const today = getVietnamDate();
        const profile = this.buildLearnerProfile(progress, today, memory);
        const tasks = this.buildTasks(profile, targetMinutes, memory);
        const totalEstimatedMinutes = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);

        const basePlan = {
            date: today,
            headline: this.buildHeadline(profile, totalEstimatedMinutes),
            motivation: this.buildMotivation(profile),
            learnerSnapshot: profile,
            tasks,
            totalEstimatedMinutes,
            mode: "rule-based"
        };

        if (this.aiProviderService) {
            return await this.aiProviderService.enhanceDailyPlan(basePlan, { userId });
        }

        return basePlan;
    }

    buildLearnerProfile(progress, today, memory = null) {
        const dailyGoal = progress?.dailyFlashcardGoal || 20;
        const todayReviews = progress?.dailyFlashcardReviews?.[today] || 0;
        const dailyGoalRemaining = Math.max(dailyGoal - todayReviews, 0);
        const studySecondsToday = progress?.dailyStudyTimes?.[today] || 0;

        return {
            hasProgress: Boolean(progress),
            streak: progress?.streak || 0,
            maxStreak: progress?.maxStreak || 0,
            experiencePoints: progress?.experiencePoints || 0,
            diamonds: progress?.diamonds || 0,
            dailyFlashcardGoal: dailyGoal,
            todayFlashcardReviews: todayReviews,
            dailyFlashcardRemaining: dailyGoalRemaining,
            isDailyFlashcardGoalAchieved: dailyGoalRemaining === 0,
            studyMinutesToday: Math.round(studySecondsToday / 60),
            memory: memory ? {
                proficiencyLevel: memory.proficiencyLevel || 'beginner',
                learningGoals: memory.learningGoals || [],
                weakSkills: memory.weakSkills || [],
                frequentMistakes: memory.frequentMistakes || [],
                preferredTopics: memory.preferredTopics || [],
                coachTone: memory.coachTone || 'friendly'
            } : null,
            unlockedCounts: {
                gates: progress?.unlockedGates?.length || 0,
                stages: progress?.unlockedStages?.length || 0,
                stories: progress?.unlockedStories?.length || 0,
                grammars: progress?.unlockedGrammars?.length || 0,
                pronunciations: progress?.unlockedPronunciations?.length || 0,
                grammarExercises: progress?.unlockedGrammarExercises?.length || 0,
                pronunciationExercises: progress?.unlockedPronunciationExercises?.length || 0,
                vocabularyExercises: progress?.unlockedVocabularyExercises?.length || 0,
                dictations: progress?.unlockedDictations?.length || 0
            }
        };
    }

    buildTasks(profile, targetMinutes, memory = null) {
        const tasks = [];
        const weakSkills = new Set(memory?.weakSkills || []);
        const learningGoals = new Set(memory?.learningGoals || []);

        if (!profile.isDailyFlashcardGoalAchieved) {
            const reviewCount = Math.min(profile.dailyFlashcardRemaining, 10);
            tasks.push(this.createTask({
                type: "flashcard",
                title: `Ôn ${reviewCount} flashcard hôm nay`,
                description: "Hoàn thành một phần mục tiêu flashcard để giữ nhịp ghi nhớ từ vựng.",
                estimatedMinutes: reviewCount <= 5 ? 3 : 4,
                priority: weakSkills.has('vocabulary') || learningGoals.has('vocabulary') ? "high" : "high",
                label: "Ôn ngay",
                path: "/flashcards"
            }));
        }

        if (profile.unlockedCounts.dictations > 0) {
            tasks.push(this.createTask({
                type: "dictation",
                title: weakSkills.has('listening') ? "Tập trung luyện nghe với dictation" : "Luyện nghe một bài dictation ngắn",
                description: weakSkills.has('listening')
                    ? "Coach ưu tiên dictation vì listening đang là kỹ năng cần củng cố."
                    : "Nghe và gõ lại câu để tăng phản xạ nhận diện âm tiếng Anh.",
                estimatedMinutes: 5,
                priority: weakSkills.has('listening') || learningGoals.has('listening') ? "high" : "medium",
                label: "Luyện nghe",
                path: "/dictation-exercise"
            }));
        }

        if (profile.unlockedCounts.grammarExercises > 0) {
            tasks.push(this.createTask({
                type: "grammar_exercise",
                title: weakSkills.has('grammar') ? "Củng cố điểm yếu ngữ pháp" : "Làm một bài ngữ pháp nhanh",
                description: weakSkills.has('grammar')
                    ? "Coach chọn bài ngữ pháp để xử lý kỹ năng bạn đang cần cải thiện."
                    : "Củng cố cấu trúc câu bằng một lượt luyện tập ngắn.",
                estimatedMinutes: 5,
                priority: weakSkills.has('grammar') || learningGoals.has('grammar') ? "high" : "medium",
                label: "Luyện ngữ pháp",
                path: "/grammar-exercise"
            }));
        }

        tasks.push(this.createTask({
            type: "chat",
            title: memory?.preferredTopics?.length
                ? `Nói chuyện với AI về ${memory.preferredTopics[0]}`
                : "Nói chuyện với AI hôm nay",
            description: weakSkills.has('speaking') || learningGoals.has('communication')
                ? "Coach ưu tiên hội thoại để tăng phản xạ giao tiếp của bạn."
                : "Luyện phản xạ giao tiếp bằng một chủ đề đơn giản trong ngày.",
            estimatedMinutes: 3,
            priority: weakSkills.has('speaking') || learningGoals.has('communication') ? "high" : (profile.streak > 0 ? "medium" : "high"),
            label: "Bắt đầu chat",
            path: "/chat"
        }));

        if (profile.unlockedCounts.pronunciationExercises > 0) {
            tasks.push(this.createTask({
                type: "pronunciation_exercise",
                title: weakSkills.has('pronunciation') ? "Luyện phát âm trọng tâm" : "Luyện phát âm một lượt",
                description: weakSkills.has('pronunciation')
                    ? "Coach ưu tiên phát âm vì đây là kỹ năng đang cần được luyện đều."
                    : "Đọc theo câu mẫu để cải thiện độ rõ và sự tự tin khi nói.",
                estimatedMinutes: 4,
                priority: weakSkills.has('pronunciation') || learningGoals.has('pronunciation') ? "high" : "low",
                label: "Luyện phát âm",
                path: "/pronunciation-exercise"
            }));
        }

        return this.fitTasksToTargetMinutes(tasks, targetMinutes);
    }

    normalizeTargetMinutes(value) {
        const parsed = Number.parseInt(value, 10);
        if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_TARGET_MINUTES;
        return Math.min(Math.max(parsed, DEFAULT_TARGET_MINUTES), MAX_TARGET_MINUTES);
    }

    createTask({ type, title, description, estimatedMinutes, priority, label, path }) {
        return {
            type,
            title,
            description,
            estimatedMinutes,
            priority,
            action: { label, path }
        };
    }

    fitTasksToTargetMinutes(tasks, targetMinutes) {
        const priorityRank = { high: 0, medium: 1, low: 2 };
        const sorted = [...tasks].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
        const desiredCount = targetMinutes <= 30 ? 3 : targetMinutes <= 60 ? 4 : sorted.length;
        const selected = sorted.slice(0, Math.max(1, Math.min(sorted.length, desiredCount)));

        return this.distributeTaskMinutes(selected, targetMinutes);
    }

    distributeTaskMinutes(tasks, targetMinutes) {
        if (!tasks.length) return [];

        const baseWeights = tasks.map((task) => Math.max(1, task.estimatedMinutes || 1));
        const totalWeight = baseWeights.reduce((sum, weight) => sum + weight, 0);
        const minimumPerTask = targetMinutes >= tasks.length * MIN_TASK_MINUTES ? MIN_TASK_MINUTES : 1;
        const assignedMinutes = baseWeights.map((weight) => (
            Math.max(minimumPerTask, Math.floor((targetMinutes * weight) / totalWeight))
        ));

        let difference = targetMinutes - assignedMinutes.reduce((sum, minutes) => sum + minutes, 0);
        let index = 0;
        let guard = 0;

        while (difference !== 0 && guard < 1000) {
            const currentIndex = index % assignedMinutes.length;
            if (difference > 0) {
                assignedMinutes[currentIndex] += 1;
                difference -= 1;
            } else if (assignedMinutes[currentIndex] > minimumPerTask) {
                assignedMinutes[currentIndex] -= 1;
                difference += 1;
            }
            index += 1;
            guard += 1;
        }

        return tasks.map((task, taskIndex) => ({
            ...task,
            estimatedMinutes: assignedMinutes[taskIndex]
        }));
    }

    buildHeadline(profile, totalMinutes) {
        if (!profile.hasProgress) {
            return `Hôm nay bạn có thể bắt đầu với ${totalMinutes} phút học nhẹ.`;
        }
        if (profile.streak > 0) {
            return `Hôm nay bạn chỉ cần ${totalMinutes} phút để duy trì thói quen học.`;
        }
        return `Bắt đầu lại thật nhẹ với ${totalMinutes} phút học hôm nay.`;
    }

    buildMotivation(profile) {
        if (!profile.hasProgress) {
            return "Mình đã chuẩn bị một lộ trình ngắn để bạn khởi động dễ hơn.";
        }
        if (profile.streak >= 3) {
            const goalText = profile.memory?.learningGoals?.includes('communication') ? ' và tăng phản xạ giao tiếp' : '';
            return `Bạn đang có streak ${profile.streak} ngày. Hoàn thành các nhiệm vụ nhỏ hôm nay để giữ đà${goalText}.`;
        }
        if (profile.dailyFlashcardRemaining > 0) {
            return `Bạn còn ${profile.dailyFlashcardRemaining} flashcard để đạt mục tiêu hôm nay.`;
        }
        return "Hôm nay chỉ cần một buổi học ngắn, đều đặn vẫn là lợi thế lớn nhất.";
    }
}

module.exports = LearningAgentService;
