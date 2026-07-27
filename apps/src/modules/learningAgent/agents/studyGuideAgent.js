class StudyGuideAgent {
    constructor(deps = {}) {
        this.dailyPlanTool = deps.dailyPlanTool || null;
        this.memoryTool = deps.memoryTool || null;
    }

    async buildCoachGuide(userId, options = {}) {
        const targetMinutes = this.normalizeTargetMinutes(options.targetMinutes);
        const dailyPlan = this.dailyPlanTool
            ? await this.dailyPlanTool.getDailyPlan(userId, { targetMinutes })
            : options.dailyPlan || null;
        const memory = this.memoryTool
            ? await this.memoryTool.getOrCreateMemory(userId)
            : options.memory || null;
        const tasks = Array.isArray(dailyPlan?.tasks) ? dailyPlan.tasks : [];

        return {
            guideId: `coach-guide-${Date.now()}`,
            title: "AI Coach Study Guide",
            targetMinutes,
            memoryVersion: memory?.memoryVersion || "learner-memory-v1",
            steps: [
                this.buildTimeStep(targetMinutes),
                ...tasks.map((task, index) => this.buildTaskStep(task, index, tasks.length)),
                this.buildMemoryProfileStep(memory)
            ],
            recommendedFirstAction: tasks[0]?.action || null,
            dailyPlan
        };
    }

    normalizeTargetMinutes(value) {
        const allowed = [10, 20, 30, 45, 60, 90, 120];
        const parsed = Number.parseInt(value || 10, 10);
        return allowed.includes(parsed) ? parsed : 10;
    }

    buildTimeStep(targetMinutes) {
        return {
            key: "set-study-time",
            type: "time_setup",
            title: "Thiết lập thời gian",
            message: `Hôm nay mình đề xuất ${targetMinutes} phút học. Bạn có thể giữ mức này hoặc chọn thời lượng khác trước khi xem kế hoạch.`,
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
