import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import { LearningAgentService } from "@/services/LearningAgentService.jsx";
import CoachMemoryPanel from "@/components/user/coach/CoachMemoryPanel.jsx";

const COACH_TARGET_MINUTES = [10, 20, 30, 45, 60, 90, 120];
const DEFAULT_TARGET_MINUTES = 10;
const TARGET_MINUTES_SESSION_KEY = "easyTalkAiCoachTargetMinutes";

function getInitialTargetMinutes() {
    const stored = Number.parseInt(sessionStorage.getItem(TARGET_MINUTES_SESSION_KEY), 10);
    return COACH_TARGET_MINUTES.includes(stored) ? stored : DEFAULT_TARGET_MINUTES;
}

const EVENT_COPY = {
    dictation: {
        icon: "fa-headphones",
        title: "Listening",
        fallback: "Agent thấy bạn vừa luyện nghe chép chính tả."
    },
    pronunciation: {
        icon: "fa-microphone-alt",
        title: "Pronunciation",
        fallback: "Agent đã ghi nhận kết quả phát âm mới."
    },
    flashcard: {
        icon: "fa-layer-group",
        title: "Vocabulary",
        fallback: "Agent thấy có từ vựng cần ôn lại."
    },
    writing: {
        icon: "fa-pen-nib",
        title: "Writing",
        fallback: "Agent đã học thêm từ bài viết của bạn."
    },
    chat: {
        icon: "fa-comments",
        title: "Speaking",
        fallback: "Agent đã ghi nhận buổi luyện nói."
    }
};

function formatLearningEvent(event) {
    const copy = EVENT_COPY[event.source] || {
        icon: "fa-magic",
        title: "Learning",
        fallback: "Agent đã ghi nhận một hoạt động học mới."
    };
    const weakSkills = Array.isArray(event.weakSkills) ? event.weakSkills.filter(Boolean) : [];
    const mistakes = Array.isArray(event.mistakes) ? event.mistakes.filter(Boolean) : [];
    const details = [];
    if (weakSkills.length) details.push(`Cần củng cố ${weakSkills.slice(0, 2).join(", ")}`);
    if (mistakes.length) details.push(`Dấu hiệu: ${mistakes.slice(0, 2).join(", ")}`);
    if (event.score !== null && event.score !== undefined) details.push(`Điểm tín hiệu ${event.score}`);

    return {
        icon: copy.icon,
        title: copy.title,
        description: details.length ? details.join(". ") : copy.fallback
    };
}

function pickPrimaryPlanReason(previousPlan, nextPlan) {
    const previousTasks = previousPlan?.tasks || [];
    const nextTasks = nextPlan?.tasks || [];
    const firstTask = nextTasks[0];
    if (!firstTask) {
        return "Mình đã cập nhật hồ sơ của bạn. Khi có thêm dữ liệu học tập, kế hoạch hôm nay sẽ được cá nhân hóa rõ hơn.";
    }

    const previousFirstTitle = previousTasks[0]?.title;
    const hasPriorityChanged = previousFirstTitle && previousFirstTitle !== firstTask.title;
    const snapshot = nextPlan?.learnerSnapshot || {};
    const memory = snapshot.memory || {};
    const weakSkills = Array.isArray(memory.weakSkills) ? memory.weakSkills.filter(Boolean) : [];
    const goals = Array.isArray(memory.learningGoals) ? memory.learningGoals.filter(Boolean) : [];
    const topics = Array.isArray(memory.preferredTopics) ? memory.preferredTopics.filter(Boolean) : [];
    const reasonParts = [];

    if (weakSkills.length) reasonParts.push(`kỹ năng yếu ${weakSkills.slice(0, 2).join(", ")}`);
    if (goals.length) reasonParts.push(`mục tiêu ${goals.slice(0, 2).join(", ")}`);
    if (topics.length) reasonParts.push(`chủ đề ${topics.slice(0, 2).join(", ")}`);

    const reason = reasonParts.length
        ? `Vì hồ sơ mới có ${reasonParts.join(" và ")}, mình ưu tiên ${firstTask.title} trước.`
        : `Mình ưu tiên ${firstTask.title} trước để kế hoạch hôm nay gọn và đúng trọng tâm hơn.`;

    return hasPriorityChanged
        ? `Mình đã cập nhật hồ sơ của bạn. Kế hoạch hôm nay đã được điều chỉnh lại. ${reason}`
        : `Mình đã cập nhật hồ sơ của bạn. Kế hoạch hôm nay đã được làm mới. ${reason}`;
}

function Coach() {
    const [plan, setPlan] = useState(null);
    const [usage, setUsage] = useState(null);
    const [learningEvents, setLearningEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isTestingProvider, setIsTestingProvider] = useState(false);
    const [targetMinutes, setTargetMinutes] = useState(getInitialTargetMinutes);

    const fetchDailyPlan = useCallback(async (minutes = DEFAULT_TARGET_MINUTES, options = {}) => {
        const { showPageLoader = true } = options;
        if (showPageLoader) setIsLoading(true);
        try {
            const data = await LearningAgentService.getDailyPlan(minutes);
            setPlan(data);
            LearningAgentService.getTodayUsage()
                .then(setUsage)
                .catch(() => setUsage(null));
            LearningAgentService.getRecentLearningEvents(5)
                .then(setLearningEvents)
                .catch(() => setLearningEvents([]));
        } catch (error) {
            console.error("Cannot load AI coach plan:", error);
            setPlan(null);
        } finally {
            if (showPageLoader) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        document.title = "AI Coach - EasyTalk";
        fetchDailyPlan(getInitialTargetMinutes());
    }, [fetchDailyPlan]);

    useEffect(() => {
        const handleTargetMinutesChanged = (event) => {
            const minutes = event.detail?.minutes || DEFAULT_TARGET_MINUTES;
            sessionStorage.setItem(TARGET_MINUTES_SESSION_KEY, String(minutes));
            setTargetMinutes(minutes);
            fetchDailyPlan(minutes, { showPageLoader: false });
        };

        window.addEventListener("easyTalk:coachTargetMinutesChanged", handleTargetMinutesChanged);
        return () => {
            window.removeEventListener("easyTalk:coachTargetMinutesChanged", handleTargetMinutesChanged);
        };
    }, [fetchDailyPlan]);

    const handleTargetChange = (minutes) => {
        if (document.documentElement.classList.contains("coach-guide-active")) {
            setTargetMinutes(minutes);
            window.dispatchEvent(new CustomEvent("easyTalk:coachTargetMinutesPicked", {
                detail: { minutes }
            }));
            return;
        }

        sessionStorage.setItem(TARGET_MINUTES_SESSION_KEY, String(minutes));
        setTargetMinutes(minutes);
        fetchDailyPlan(minutes);
        window.dispatchEvent(new CustomEvent("easyTalk:coachTargetMinutesPicked", {
            detail: { minutes }
        }));
    };

    const handleProviderTest = async () => {
        setIsTestingProvider(true);
        try {
            const result = await LearningAgentService.testProvider();
            await LearningAgentService.getTodayUsage().then(setUsage).catch(() => {});
            Swal.fire({
                icon: result.ok ? "success" : "warning",
                title: result.ok ? "Provider sẵn sàng" : "Provider phản hồi chưa đạt",
                text: `${result.message || "Đã nhận phản hồi."} (${result.latencyMs || 0}ms)`,
                timer: 2500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Provider test thất bại",
                text: error.message || "Vui lòng kiểm tra API key, model hoặc quota."
            });
        } finally {
            setIsTestingProvider(false);
        }
    };

    const handleMemorySaved = async () => {
        const previousPlan = plan;
        try {
            const updatedPlan = await LearningAgentService.getDailyPlan(targetMinutes);
            setPlan(updatedPlan);
            LearningAgentService.getTodayUsage()
                .then(setUsage)
                .catch(() => setUsage(null));
            LearningAgentService.getRecentLearningEvents(5)
                .then(setLearningEvents)
                .catch(() => setLearningEvents([]));
            window.dispatchEvent(new CustomEvent("easyTalk:coachPlanRefreshed", {
                detail: {
                    message: pickPrimaryPlanReason(previousPlan, updatedPlan)
                }
            }));
        } catch (error) {
            console.error("Cannot refresh plan after memory update:", error);
            Swal.fire({
                icon: "warning",
                title: "Đã lưu hồ sơ",
                text: "AI Coach chưa tải lại được kế hoạch mới. Bạn có thể thử làm mới trang.",
                timer: 2600,
                showConfirmButton: false
            });
        }
    };

    if (isLoading) return <LoadingScreen />;

    if (!plan) {
        return (
            <div className="coach-page container">
                <div className="coach-empty">
                    <i className="fas fa-brain"></i>
                    <h2>AI Coach chưa sẵn sàng</h2>
                    <p>Không thể tải kế hoạch học hôm nay. Vui lòng thử lại sau.</p>
                    <button className="coach-primary-btn" onClick={() => fetchDailyPlan(targetMinutes)}>
                        <i className="fas fa-sync-alt"></i>
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const snapshot = plan.learnerSnapshot || {};
    const tasks = plan.tasks || [];

    return (
        <div className="coach-page container">
            <section className="coach-hero">
                <div
                    className="coach-hero-main"
                    data-coach-target="coach-time-setup"
                    data-coach-guide-target="study-time"
                >
                    <span className="coach-kicker">
                        <i className="fas fa-brain"></i>
                        AI English Coach
                    </span>
                    <h2>{plan.headline}</h2>
                    <p>{plan.motivation}</p>
                    <div className="coach-targets" aria-label="Chọn thời lượng học">
                        {COACH_TARGET_MINUTES.map((minutes) => (
                            <button
                                key={minutes}
                                className={`coach-target-btn ${targetMinutes === minutes ? "active" : ""}`}
                                onClick={() => handleTargetChange(minutes)}
                            >
                                {minutes} phút
                            </button>
                        ))}
                    </div>
                </div>
                <div className="coach-summary">
                    <div>
                        <strong>{snapshot.streak || 0}</strong>
                        <span>Streak</span>
                    </div>
                    <div>
                        <strong>{snapshot.experiencePoints || 0}</strong>
                        <span>XP</span>
                    </div>
                    <div>
                        <strong>{plan.totalEstimatedMinutes || 0}</strong>
                        <span>Phút hôm nay</span>
                    </div>
                </div>
            </section>

            <section className="coach-grid">
                <div className="coach-plan">
                    <div className="coach-section-heading">
                        <h3>Kế hoạch hôm nay</h3>
                        <span>{plan.aiProvider?.isMock ? "Mock AI" : (plan.mode === "rule-based" ? "Bản nền Agent" : "AI cá nhân hóa")}</span>
                    </div>
                    <div className="coach-task-list">
                        {tasks.map((task, index) => (
                            <article
                                key={`${task.type}-${index}`}
                                className={`coach-task priority-${task.priority}`}
                                data-coach-target={`daily-plan-task-${index}`}
                                data-coach-guide-task-index={index}
                            >
                                <div className="coach-task-index">{index + 1}</div>
                                <div className="coach-task-body">
                                    <div className="coach-task-topline">
                                        <h4>{task.title}</h4>
                                        <span>{task.estimatedMinutes} phút</span>
                                    </div>
                                    <p>{task.description}</p>
                                    <Link className="coach-task-action" to={task.action?.path || "/"}>
                                        {task.action?.label || "Bắt đầu"}
                                        <i className="fas fa-arrow-right"></i>
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>

                <aside className="coach-insight">
                    <h3>Nhịp học của bạn</h3>
                    <div className="coach-insight-row">
                        <span>Flashcard hôm nay</span>
                        <strong>
                            {snapshot.todayFlashcardReviews || 0}/{snapshot.dailyFlashcardGoal || 20}
                        </strong>
                    </div>
                    <div className="coach-progress-bar">
                        <span
                            style={{
                                width: `${Math.min(
                                    100,
                                    ((snapshot.todayFlashcardReviews || 0) / (snapshot.dailyFlashcardGoal || 20)) * 100
                                )}%`
                            }}
                        ></span>
                    </div>
                    <div className="coach-insight-row">
                        <span>Còn lại</span>
                        <strong>{snapshot.dailyFlashcardRemaining || 0} thẻ</strong>
                    </div>
                    <div className="coach-insight-row">
                        <span>Đã học hôm nay</span>
                        <strong>{snapshot.studyMinutesToday || 0} phút</strong>
                    </div>
                    {usage && (
                        <div className="coach-insight-row">
                            <span>Lượt AI hôm nay</span>
                            <strong>{usage.requests}/{usage.limit || "∞"}</strong>
                        </div>
                    )}
                    <div className="coach-next-note">
                        <i className="fas fa-lightbulb"></i>
                        <p>Coach đang kết hợp kế hoạch hôm nay với trí nhớ học tập để chọn việc nên học tiếp.</p>
                    </div>
                    <button className="coach-provider-test" onClick={handleProviderTest} disabled={isTestingProvider}>
                        <i className={isTestingProvider ? "fas fa-spinner fa-spin" : "fas fa-vial"}></i>
                        {isTestingProvider ? "Đang test..." : "Test AI provider"}
                    </button>
                </aside>
            </section>

            <section className="coach-learning-events">
                <div className="coach-section-heading">
                    <h3>Agent đã học được gì từ bạn gần đây</h3>
                    <span>{learningEvents.length ? `${learningEvents.length} tín hiệu mới` : "Đang quan sát"}</span>
                </div>
                {learningEvents.length ? (
                    <div className="coach-event-list">
                        {learningEvents.map((event, index) => {
                            const formatted = formatLearningEvent(event);
                            return (
                                <article key={event._id || `${event.source}-${index}`} className="coach-event-item">
                                    <div className="coach-event-icon">
                                        <i className={`fas ${formatted.icon}`}></i>
                                    </div>
                                    <div>
                                        <div className="coach-event-topline">
                                            <h4>{formatted.title}</h4>
                                            <span>{event.eventType || "learning_activity"}</span>
                                        </div>
                                        <p>{formatted.description}</p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="coach-event-empty">
                        <i className="fas fa-seedling"></i>
                        <p>Làm thử dictation, pronunciation, flashcard hoặc chat để Agent bắt đầu ghi nhận thói quen học của bạn.</p>
                    </div>
                )}
            </section>

            <CoachMemoryPanel onMemorySaved={handleMemorySaved} />
        </div>
    );
}

export default Coach;
