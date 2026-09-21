const LearnerMemory = require('../models/learnerMemory');

class StudyGuideAgent {
    constructor(deps = {}) {
        this.dailyPlanTool = deps.dailyPlanTool || null;
        this.memoryTool = deps.memoryTool || null;
    }

    async buildCoachGuide(userId, options = {}) {
        const requestedTargetMinutes = options.targetMinutes === null || options.targetMinutes === undefined
            ? null
            : this.normalizeTargetMinutes(options.targetMinutes);
        const memory = this.memoryTool
            ? await this.memoryTool.getOrCreateMemory(userId)
            : options.memory || null;
        const targetResolution = LearnerMemory.resolveTargetStudyMinutes(memory, requestedTargetMinutes);
        const targetMinutes = targetResolution.effectiveTargetMinutes;
        const dailyPlan = this.dailyPlanTool
            ? await this.dailyPlanTool.getDailyPlan(userId, { targetMinutes })
            : options.dailyPlan || null;
        const tasks = Array.isArray(dailyPlan?.tasks) ? dailyPlan.tasks : [];
        const profileCompleteness = this.calculateProfileCompleteness(dailyPlan, memory);
        const isNewLearner = this.isNewLearner(dailyPlan, memory, profileCompleteness);
        const shouldAskMemoryUpdate = this.shouldAskMemoryUpdate(memory, profileCompleteness, isNewLearner);

        return {
            guideId: `coach-guide-${Date.now()}`,
            title: "AI Coach Study Guide",
            targetMinutes,
            recommendedFlow: isNewLearner ? "new_learner_onboarding" : "daily_plan_first",
            isNewLearner,
            profileCompleteness,
            shouldAskMemoryUpdate,
            memoryVersion: memory?.memoryVersion || "learner-memory-v1",
            steps: [
                isNewLearner ? this.buildNewLearnerProfileStep(memory) : null,
                this.buildTimeStep(targetMinutes, memory, targetResolution),
                ...tasks.map((task, index) => this.buildTaskStep(task, index, tasks.length)),
                shouldAskMemoryUpdate ? this.buildMemoryProfileStep(memory) : null
            ].filter(Boolean),
            recommendedFirstAction: tasks[0]?.action || null,
            dailyPlan
        };
    }

    calculateProfileCompleteness(dailyPlan = null, memory = null) {
        let score = 0;
        if (memory?.proficiencyLevel) score += 20;
        if (memory?.learningGoals?.length) score += 25;
        if (memory?.weakSkills?.length) score += 25;
        if (memory?.preferredTopics?.length) score += 20;
        if (dailyPlan?.learnerSnapshot?.studyMinutesToday > 0 || dailyPlan?.learnerSnapshot?.experiencePoints > 0) {
            score = Math.max(score, 45);
        }
        return Math.min(score, 100);
    }

    isNewLearner(dailyPlan = null, memory = null, profileCompleteness = 0) {
        const snapshot = dailyPlan?.learnerSnapshot || {};
        const hasLearningHistory = (snapshot.experiencePoints || 0) > 0
            || (snapshot.studyMinutesToday || 0) > 0
            || (snapshot.todayFlashcardReviews || 0) > 0
            || (snapshot.maxStreak || 0) > 1;
        const hasPersonalizedMemory = Boolean(
            memory?.preferredTopics?.length
            || memory?.weakSkills?.length
            || memory?.frequentMistakes?.length
            || memory?.learningGoals?.length
        );
        return !hasLearningHistory && (!hasPersonalizedMemory || profileCompleteness < 70);
    }

    shouldAskMemoryUpdate(memory = null, profileCompleteness = 0, isNewLearner = false) {
        if (isNewLearner) return false;
        if (profileCompleteness < 70) return true;
        if (!memory?.updatedAt) return false;
        const daysSinceUpdate = Math.floor((Date.now() - new Date(memory.updatedAt).getTime()) / 86400000);
        return Number.isFinite(daysSinceUpdate) && daysSinceUpdate >= 14;
    }

    normalizeTargetMinutes(value) {
        const allowed = [10, 20, 30, 45, 60, 90, 120];
        const parsed = Number.parseInt(value || 10, 10);
        return allowed.includes(parsed) ? parsed : 10;
    }

    buildTimeStep(targetMinutes, memory = null, targetResolution = null) {
        const recommendation = targetResolution || this.recommendTargetMinutes(memory);
        const recommendedMinutes = recommendation.minutes || recommendation.recommendedMinutes;
        const minimumSelectableMinutes = recommendation.minimumSelectableMinutes || recommendedMinutes;
        const allowedMinutes = recommendation.allowedMinutes || [10, 20, 30, 45, 60, 90, 120].filter(minutes => minutes >= minimumSelectableMinutes);
        return {
            key: "set-study-time",
            type: "time_setup",
            title: "Thiết lập thời gian",
            message: `Dựa trên hồ sơ hiện tại, mình gợi ý tối thiểu ${minimumSelectableMinutes} phút học hôm nay: ${recommendation.reason || recommendation.recommendationReason}. Bạn vẫn có thể chọn thời lượng cao hơn, mình sẽ chia lại kế hoạch theo đúng lựa chọn của bạn.`,
            recommendedMinutes,
            minimumSelectableMinutes,
            allowedMinutes,
            savedTargetMinutes: recommendation.savedTargetMinutes || null,
            recommendationReason: recommendation.reason || recommendation.recommendationReason,
            target: {
                page: "/coach",
                selector: "[data-coach-guide-target='study-time']"
            },
            actions: [
                { type: "confirm_time", label: `Thiết lập ${targetMinutes} phút`, value: targetMinutes },
                { type: "default_time", label: "Dùng 10 phút", value: 10 }
            ]
        };
    }

    recommendTargetMinutes(memory = null) {
        return LearnerMemory.recommendTargetMinutes(memory);
    }

    buildNewLearnerProfileStep() {
        return {
            key: "new-learner-profile",
            type: "new_learner_profile",
            title: "Thiết lập hồ sơ học tập",
            message: "Chào mừng bạn đến với EasyTalk. Mình muốn làm quen một chút để kèm bạn học đúng trọng tâm hơn. Bạn có muốn thiết lập hồ sơ học tập không?",
            target: {
                page: "/coach",
                selector: "[data-coach-guide-target='new-learner-profile']"
            },
            fields: [
                { key: "proficiencyLevel", type: "single_select", label: "Trình độ hiện tại", options: ["newbie", "beginner", "elementary", "intermediate"] },
                { key: "learningGoals", type: "multi_select", label: "Mục tiêu học", maxSelections: 3, options: ["learning_journey", "story_lesson", "grammar_lesson", "pronunciation_lesson", "flashcard_practice", "grammar_practice", "vocabulary_practice", "pronunciation_practice", "dictation_practice", "ai_chat", "ai_writing"] },
                { key: "weakSkills", type: "multi_select", label: "Kỹ năng yếu cần ưu tiên", maxSelections: 2, options: ["grammar", "vocabulary", "pronunciation", "listening", "speaking", "writing"] },
                { key: "preferredTopics", type: "chips", label: "Chủ đề yêu thích luyện nói và luyện viết", options: ["travel", "work", "food", "daily life", "school", "business"] }
            ],
            actions: [
                { type: "update_memory", label: "Thiết lập hồ sơ học tập" },
                { type: "dismiss", label: "Để sau" }
            ]
        };
    }

    buildTaskStep(task, index, totalTasks) {
        return {
            key: `daily-task-${index + 1}`,
            type: "daily_plan_task",
            title: task.title || `Bước ${index + 1}`,
            message: this.buildTaskMessage(task, index, totalTasks),
            order: index + 1,
            total: totalTasks,
            estimatedMinutes: task.estimatedMinutes || null,
            priority: task.priority || "medium",
            taskType: task.type,
            target: {
                page: "/coach",
                selector: `[data-coach-guide-task-index='${index}']`
            },
            actions: [
                {
                    type: "navigate",
                    label: task.action?.label || "Bắt đầu bước này",
                    path: task.action?.path || "/coach"
                }
            ]
        };
    }

    buildTaskMessage(task, index, totalTasks) {
        if (index === 0) {
            return `${task.title} là bước ưu tiên nhất trong ${totalTasks} kế hoạch hôm nay. Mình chọn bước này vì nó bám sát dữ liệu học và mục tiêu hiện tại của bạn.`;
        }
        return `${task.title} cũng nằm trong kế hoạch hôm nay. Nếu bạn muốn đổi nhịp, mình có thể đưa bạn tới đúng phần học này.`;
    }

    buildMemoryProfileStep(memory = null) {
        const weakSkills = memory?.weakSkills?.length ? memory.weakSkills.join(", ") : "chưa có kỹ năng yếu rõ ràng";
        return {
            key: "memory-profile-check",
            type: "memory_profile",
            title: "Hồ sơ học tập",
            message: `Mình đang cá nhân hóa kế hoạch theo hồ sơ học tập của bạn. Kỹ năng cần chú ý hiện tại: ${weakSkills}. Bạn có muốn cập nhật mục tiêu, trình độ hoặc chủ đề yêu thích không?`,
            target: {
                page: "/coach",
                selector: "[data-coach-guide-target='learner-memory']"
            },
            actions: [
                { type: "scroll", label: "Có, chỉnh hồ sơ", selector: "[data-coach-guide-target='learner-memory']" },
                { type: "dismiss", label: "Không, bỏ qua" }
            ]
        };
    }
}

module.exports = StudyGuideAgent;
