const { getVietnamDate } = require('../../../shared/utils/dateFormat');

const DEFAULT_TARGET_MINUTES = 10;
const MAX_TARGET_MINUTES = 120;
const MIN_TASK_MINUTES = 3;

class DailyPlanAgent {
    buildPlan(progress, memory = null, options = {}) {
        const targetMinutes = this.normalizeTargetMinutes(options.targetMinutes);
        const today = options.date || getVietnamDate();
        const profile = this.buildLearnerProfile(progress, today, memory);
        const tasks = this.buildTasks(profile, targetMinutes, memory);
        const totalEstimatedMinutes = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);

        return {
            date: today,
            headline: this.buildHeadline(profile, totalEstimatedMinutes),
            motivation: this.buildMotivation(profile),
            learnerSnapshot: profile,
            tasks,
            totalEstimatedMinutes,
            mode: "rule-based"
        };
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
                preferredTopics: memory.preferredTopics || []
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
        const weakSkills = new Set((memory?.weakSkills || []).slice(0, 2));
        const learningGoals = new Set((memory?.learningGoals || []).slice(0, 3));
        const frequentMistakes = Array.isArray(memory?.frequentMistakes) ? memory.frequentMistakes.filter(Boolean) : [];
        const preferredTopic = memory?.preferredTopics?.[0] || "travel";
        const tasks = [];
        const addTask = (task) => {
            if (!task || tasks.some(existing => existing.type === task.type)) return;
            tasks.push(task);
        };
        const hasExplicitFocus = weakSkills.size > 0
            || learningGoals.size > 0
            || frequentMistakes.length > 0;

        frequentMistakes.forEach((mistake) => {
            addTask(this.createMistakeTask(mistake, profile, preferredTopic));
        });

        if (weakSkills.has("grammar")) {
            addTask(this.createGrammarLessonTask("high"));
            addTask(this.createGrammarPracticeTask("high"));
        }
        if (weakSkills.has("vocabulary")) {
            addTask(this.createFlashcardTask(profile, "high"));
            addTask(this.createVocabularyPracticeTask("high"));
        }
        if (weakSkills.has("pronunciation")) {
            addTask(this.createPronunciationLessonTask("high"));
            addTask(this.createPronunciationPracticeTask(profile, "high"));
        }
        if (weakSkills.has("listening")) addTask(this.createListeningTask(profile, "high"));
        if (weakSkills.has("speaking")) addTask(this.createSpeakingTask(preferredTopic, "high"));
        if (weakSkills.has("writing")) addTask(this.createWritingTask(preferredTopic, "high"));

        learningGoals.forEach((goal) => {
            addTask(this.createTaskForLearningGoal(goal, profile, preferredTopic, "high"));
        });

        if (!hasExplicitFocus) {
            addTask(this.createJourneyTask("high"));
            addTask(this.createListeningTask(profile, "medium"));
            addTask(this.createSpeakingTask(preferredTopic, profile.streak > 0 ? "medium" : "high"));
            addTask(this.createFlashcardTask(profile, "medium"));
        }

        return this.fitTasksToTargetMinutes(tasks, targetMinutes);
    }

    createTaskForLearningGoal(goal, profile, topic, priority = "medium") {
        const map = {
            learning_journey: () => this.createJourneyTask(priority),
            story_lesson: () => this.createStoryLessonTask(priority),
            grammar_lesson: () => this.createGrammarLessonTask(priority),
            pronunciation_lesson: () => this.createPronunciationLessonTask(priority),
            flashcard_practice: () => this.createFlashcardTask(profile, priority),
            grammar_practice: () => this.createGrammarPracticeTask(priority),
            vocabulary_practice: () => this.createVocabularyPracticeTask(priority),
            pronunciation_practice: () => this.createPronunciationPracticeTask(profile, priority),
            dictation_practice: () => this.createListeningTask(profile, priority),
            ai_chat: () => this.createSpeakingTask(topic, priority),
            ai_writing: () => this.createWritingTask(topic, priority),
            communication: () => this.createSpeakingTask(topic, priority),
            listening: () => this.createListeningTask(profile, priority),
            grammar: () => this.createGrammarPracticeTask(priority),
            pronunciation: () => this.createPronunciationPracticeTask(profile, priority),
            writing: () => this.createWritingTask(topic, priority),
            vocabulary: () => this.createFlashcardTask(profile, priority),
            daily_habit: () => this.createJourneyTask(priority)
        };
        return map[goal]?.() || null;
    }

    createJourneyTask(priority = "medium") {
        return this.createTask({
            type: "learning_journey",
            title: "Tiếp tục hành trình học tập",
            description: "Đi theo lộ trình chính để mở khóa bài học theo đúng tiến độ EasyTalk.",
            estimatedMinutes: 6,
            priority,
            label: "Vào hành trình",
            path: "/journey"
        });
    }

    createStoryLessonTask(priority = "medium") {
        return this.createTask({
            type: "story_lesson",
            title: "Học một câu chuyện tiếng Anh",
            description: "Đọc câu chuyện ngắn để tăng khả năng hiểu ngữ cảnh và ghi nhớ mẫu câu tự nhiên.",
            estimatedMinutes: 6,
            priority,
            label: "Học câu chuyện",
            path: "/story"
        });
    }

    createGrammarLessonTask(priority = "medium") {
        return this.createTask({
            type: "grammar_lesson",
            title: "Học bài ngữ pháp trọng tâm",
            description: "Ôn lại kiến thức nền trước khi làm bài tập để tránh luyện sai cách.",
            estimatedMinutes: 6,
            priority,
            label: "Học ngữ pháp",
            path: "/grammar"
        });
    }

    createPronunciationLessonTask(priority = "medium") {
        return this.createTask({
            type: "pronunciation_lesson",
            title: "Học bài phát âm trọng tâm",
            description: "Nắm lại khẩu hình và âm mục tiêu trước khi bước vào phần luyện phát âm.",
            estimatedMinutes: 5,
            priority,
            label: "Học phát âm",
            path: "/pronunciation"
        });
    }

    createFlashcardTask(profile, priority = "medium") {
        if (profile.isDailyFlashcardGoalAchieved) return null;
        const reviewCount = Math.min(profile.dailyFlashcardRemaining, 10);
        return this.createTask({
            type: "flashcard",
            title: `Ôn ${reviewCount} flashcard hôm nay`,
            description: "Ôn lại từ vựng khi mục tiêu hoặc điểm yếu của bạn cần củng cố vocabulary.",
            estimatedMinutes: reviewCount <= 5 ? 3 : 4,
            priority,
            label: "Ôn ngay",
            path: "/flashcards"
        });
    }

    createListeningTask(profile, priority = "medium") {
        if (profile.unlockedCounts.dictations <= 0) return null;
        return this.createTask({
            type: "dictation",
            title: "Tập trung luyện nghe với dictation",
            description: "Coach ưu tiên dictation vì listening đang là kỹ năng cần củng cố.",
            estimatedMinutes: 5,
            priority,
            label: "Luyện nghe",
            path: "/dictation-exercise"
        });
    }

    createGrammarPracticeTask(priority = "medium") {
        return this.createTask({
            type: "grammar_exercise",
            title: "Luyện tập ngữ pháp",
            description: "Làm bài tập ngữ pháp để kiểm tra bạn đã áp dụng đúng kiến thức vừa học.",
            estimatedMinutes: 5,
            priority,
            label: "Luyện ngữ pháp",
            path: "/grammar-exercise"
        });
    }

    createSpeakingTask(topic = "travel", priority = "medium") {
        return this.createTask({
            type: "chat",
            title: `Luyện giao tiếp chủ đề ${topic}`,
            description: "Coach ưu tiên hội thoại vì mục tiêu hiện tại của bạn là giao tiếp.",
            estimatedMinutes: 5,
            priority,
            label: "Bắt đầu chat",
            path: "/chat"
        });
    }

    createPronunciationTask(profile, priority = "medium") {
        return this.createPronunciationPracticeTask(profile, priority);
    }

    createPronunciationPracticeTask(profile, priority = "medium") {
        if (profile.unlockedCounts.pronunciationExercises <= 0) return null;
        return this.createTask({
            type: "pronunciation_exercise",
            title: "Luyện phát âm trọng tâm",
            description: "Coach ưu tiên phát âm vì đây là kỹ năng đang cần được luyện đều.",
            estimatedMinutes: 4,
            priority,
            label: "Luyện phát âm",
            path: "/pronunciation-exercise"
        });
    }

    createVocabularyPracticeTask(priority = "medium") {
        return this.createTask({
            type: "vocabulary_exercise",
            title: "Luyện tập từ vựng",
            description: "Làm bài tập từ vựng để kiểm tra khả năng nhận diện và dùng từ trong ngữ cảnh.",
            estimatedMinutes: 5,
            priority,
            label: "Luyện từ vựng",
            path: "/vocabulary-exercise"
        });
    }

    createWritingTask(topic = "travel", priority = "medium") {
        return this.createTask({
            type: "writing",
            title: `Luyện viết ngắn về ${topic}`,
            description: "Viết một đoạn ngắn để Coach sửa lỗi và ghi nhớ điểm cần cải thiện.",
            estimatedMinutes: 6,
            priority,
            label: "Luyện viết",
            path: "/writing"
        });
    }

    createReadingTask(topic = "travel", priority = "medium") {
        return this.createTask({
            type: "chat",
            title: `Đọc hiểu nhanh chủ đề ${topic}`,
            description: "Coach sẽ hỏi đáp ngắn để kiểm tra bạn hiểu ý chính và từ khóa.",
            estimatedMinutes: 5,
            priority,
            label: "Bắt đầu chat",
            path: "/chat"
        });
    }

    createMistakeTask(mistake, profile, topic) {
        const normalizedMistake = String(mistake || "").toLowerCase();
        if (/(pronunciation|phát âm|\/|sound|âm)/i.test(normalizedMistake)) {
            return this.createPronunciationTask(profile, "high");
        }
        if (/(vocab|word|từ vựng|luggage|noun|verb|adjective)/i.test(normalizedMistake)) {
            return this.createFlashcardTask(profile, "high");
        }
        if (/(write|writing|viết|coherence|paragraph)/i.test(normalizedMistake)) {
            return this.createWritingTask(topic, "high");
        }
        return this.createGrammarPracticeTask("high") || this.createWritingTask(topic, "high");
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
        const desiredCount = targetMinutes <= 10 ? 3 : targetMinutes <= 30 ? 4 : targetMinutes <= 60 ? 5 : sorted.length;
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

    buildHeadline() {
        return "Bạn muốn học bao lâu hôm nay?";
    }

    buildMotivation(profile) {
        const focusLabels = this.getFocusLabels(profile).slice(0, 3);
        const focusText = focusLabels.length ? ` Trọng tâm hôm nay: ${focusLabels.join(", ")}.` : "";
        if (!profile.hasProgress) {
            return `Coach sẽ chia kế hoạch theo hồ sơ học tập hiện tại của bạn.${focusText}`;
        }
        if (profile.streak >= 3) {
            const goalText = profile.memory?.learningGoals?.includes('ai_chat') ? ' và tăng phản xạ giao tiếp' : '';
            return `Bạn đang có streak ${profile.streak} ngày. Coach sẽ chia kế hoạch vừa sức để giữ đà${goalText}.${focusText}`;
        }
        if (profile.dailyFlashcardRemaining > 0) {
            return `Coach sẽ chia kế hoạch theo hồ sơ học tập hiện tại của bạn. Bạn còn ${profile.dailyFlashcardRemaining} flashcard hôm nay.${focusText}`;
        }
        return `Coach sẽ chia kế hoạch theo hồ sơ học tập hiện tại của bạn.${focusText}`;
    }

    getFocusLabels(profile) {
        const labels = {
            learning_journey: "hành trình học tập",
            story_lesson: "bài học câu chuyện",
            grammar_lesson: "bài học ngữ pháp",
            pronunciation_lesson: "bài học phát âm",
            flashcard_practice: "flashcard",
            grammar_practice: "luyện tập ngữ pháp",
            vocabulary_practice: "luyện tập từ vựng",
            pronunciation_practice: "luyện tập phát âm",
            dictation_practice: "nghe chép chính tả",
            ai_chat: "giao tiếp với AI",
            ai_writing: "luyện viết với AI",
            grammar: "ngữ pháp",
            vocabulary: "từ vựng",
            pronunciation: "phát âm",
            listening: "nghe",
            speaking: "nói",
            writing: "viết"
        };
        const memory = profile.memory || {};
        return [
            ...(memory.weakSkills || []),
            ...(memory.learningGoals || [])
        ]
            .map(value => labels[value] || value)
            .filter(Boolean);
    }
}

module.exports = DailyPlanAgent;
