import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthService } from "@/services/AuthService.jsx";
import { LearningAgentService } from "@/services/LearningAgentService.jsx";
import CoachGuideOverlay from "@/components/user/coach/CoachGuideOverlay.jsx";

const PENDING_TASK_SESSION_KEY = "easyTalkAiCoachPendingTask";
const START_GUIDE_SESSION_KEY = "easyTalkAiCoachStartGuide";
const WELCOME_SEEN_SESSION_KEY = "easyTalkAiCoachWelcomeSeenV4";
const TARGET_MINUTES_SESSION_KEY = "easyTalkAiCoachTargetMinutes";
const DEFAULT_TARGET_MINUTES = 10;
const COACH_TARGET_MINUTES = [10, 20, 30, 45, 60, 90, 120];

function getStoredTargetMinutes() {
    const stored = Number.parseInt(sessionStorage.getItem(TARGET_MINUTES_SESSION_KEY), 10);
    return COACH_TARGET_MINUTES.includes(stored) ? stored : DEFAULT_TARGET_MINUTES;
}

function getUserDisplayName() {
    const user = AuthService.getCurrentUser?.();
    return user?.username || user?.name || user?.email?.split("@")[0] || "bạn";
}

function getTaskTypeLabel(type) {
    const labels = {
        flashcard: "ôn từ vựng",
        dictation: "luyện nghe chủ động",
        listening: "luyện nghe",
        chat: "luyện nói",
        speaking: "luyện nói",
        writing: "luyện viết",
        grammar: "ngữ pháp",
        pronunciation: "phát âm",
        vocabulary: "từ vựng"
    };
    return labels[type] || "học tập";
}

function getWeakSkillMessage(memory = {}) {
    const weakSkill = Array.isArray(memory.weakSkills) ? memory.weakSkills[0] : null;
    const messages = {
        listening: "Mình ưu tiên listening vì gần đây đây là kỹ năng cần củng cố.",
        grammar: "Mình ưu tiên grammar để sửa nền câu trước khi bạn nói hoặc viết dài hơn.",
        pronunciation: "Mình ưu tiên pronunciation để bạn nói rõ hơn và tự tin hơn.",
        vocabulary: "Mình ưu tiên vocabulary để bạn có nguyên liệu dùng trong các bài tiếp theo.",
        speaking: "Mình ưu tiên speaking để giữ phản xạ giao tiếp.",
        writing: "Mình ưu tiên writing để bạn biến kiến thức thành câu hoàn chỉnh."
    };
    return messages[weakSkill] || "Mình chọn dựa trên kế hoạch hôm nay, tiến độ và tín hiệu học gần đây của bạn.";
}

function getTaskReason(task, index, memory) {
    if (!task) return "Mình sẽ đi cùng bạn từng bước, bắt đầu từ phần phù hợp nhất hôm nay.";
    if (index === 0) {
        return `${getWeakSkillMessage(memory)} Vì vậy mình đề xuất bắt đầu với ${task.title}, chỉ khoảng ${task.estimatedMinutes || 5} phút để bạn vào nhịp nhẹ nhàng.`;
    }
    return `${task.title} cũng nằm trong kế hoạch hôm nay. Nếu hôm nay bạn muốn ưu tiên ${getTaskTypeLabel(task.type)}, mình sẽ đi theo lựa chọn này và đưa bạn tới đúng phần học.`;
}

function getTaskReadyMessage(task) {
    if (!task) return "Bạn đã vào đúng phần học rồi. Khi sẵn sàng, mình sẽ thu gọn để bạn tập trung.";
    return `Bạn đã vào phần ${getTaskTypeLabel(task.type)}. Hôm nay mình chọn ${task.title} cho bước này. Bạn sẵn sàng học chưa?`;
}

function getTaskTargetKey(task, pathname) {
    const type = task?.type;
    if (["dictation", "listening"].includes(type) || pathname.startsWith("/dictation-exercise")) {
        return "agent-task-dictation-current";
    }
    if (["writing"].includes(type) || pathname.startsWith("/writing")) {
        return "agent-task-writing-workspace";
    }
    if (["chat", "speaking"].includes(type) || pathname.startsWith("/chat")) {
        return "agent-task-chat-workspace";
    }
    return null;
}

function getCoachBriefing(plan, memory) {
    const tasks = plan?.tasks || [];
    const firstTask = tasks[0];
    if (!firstTask) {
        return "Bạn đang ở phòng Coach rồi. Mình chưa thấy đủ dữ liệu, nên hôm nay ta bắt đầu bằng một phiên học ngắn để giữ nhịp.";
    }
    const taskNames = tasks.map((task) => task.title).join(", ");
    return `Hôm nay mình có ${tasks.length} kế hoạch cho bạn: ${taskNames}. Mình đề xuất học ${firstTask.title} trước. ${getWeakSkillMessage(memory)}`;
}

function getProfilePromptMessage() {
    return "Mình đã đi qua kế hoạch hôm nay rồi. Bạn có muốn cập nhật Hồ sơ học tập không? Nếu mục tiêu, trình độ, kỹ năng yếu hoặc chủ đề yêu thích thay đổi, mình sẽ cá nhân hóa kế hoạch chính xác hơn.";
}

function getProfileFocusMessage() {
    return "Bạn chỉnh mục tiêu, trình độ, kỹ năng yếu và chủ đề yêu thích ở đây. Xong thì mình sẽ cá nhân hóa kế hoạch sát hơn.";
}

function getTimeSetupMessage(minutes) {
    if (minutes !== DEFAULT_TARGET_MINUTES) {
        return `Bạn đã chọn ${minutes} phút học hôm nay, bạn có muốn thiết lập không?`;
    }
    return `Hôm nay chỉ cần ${minutes} phút để duy trì thói quen học tập. Bạn có muốn thiết lập lại thời gian học hôm nay không?`;
}

function getTimeConfirmedMessage(minutes) {
    return `Bạn đã thiết lập ${minutes} phút học hôm nay. Mình sẽ điều chỉnh kế hoạch theo thời lượng này. Bấm tiếp tục để mình chỉ từng bước trong kế hoạch hôm nay.`;
}

function speakBrowserCoachText(text, setMood) {
    if (!window.speechSynthesis || !text) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 0.94;
    utterance.pitch = 1.05;
    utterance.onstart = () => setMood("talking");
    utterance.onend = () => setMood("idle");
    utterance.onerror = () => setMood("idle");
    window.speechSynthesis.speak(utterance);
    return true;
}

function CoachCompanion() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [plan, setPlan] = useState(null);
    const [mood, setMood] = useState("idle");
    const [guideMode, setGuideMode] = useState("welcome");
    const [currentStep, setCurrentStep] = useState(0);
    const [pendingTask, setPendingTask] = useState(null);
    const [externalCoachMessage, setExternalCoachMessage] = useState("");
    const [selectedTargetMinutes, setSelectedTargetMinutes] = useState(getStoredTargetMinutes);
    const lastFetchedMinutesRef = useRef(null);
    const autoSpeakKeyRef = useRef("");
    const audioRef = useRef(null);
    const audioUrlRef = useRef("");
    const audioContextRef = useRef(null);
    const intentionalStopRef = useRef(false);
    const speechTimerRef = useRef(null);
    const location = useLocation();
    const navigate = useNavigate();
    const isCoachPage = location.pathname === "/coach";
    const tasks = useMemo(() => plan?.tasks || [], [plan?.tasks]);
    const snapshot = plan?.learnerSnapshot || {};
    const memory = useMemo(() => snapshot.memory || {}, [snapshot.memory]);
    const remainingFlashcards = snapshot.dailyFlashcardRemaining || 0;

    const tourSteps = useMemo(() => tasks.map((task, index) => ({
        title: task.title,
        meta: `${task.estimatedMinutes || 5} phút · ${getTaskTypeLabel(task.type)}`,
        targetKey: `daily-plan-task-${index}`,
        task,
        onSelect: setCurrentStep
    })), [tasks]);

    const activeStep = tourSteps[currentStep];
    const activeTask = activeStep?.task;

    const stopSpeaking = useCallback(() => {
        intentionalStopRef.current = true;
        if (speechTimerRef.current) {
            window.clearTimeout(speechTimerRef.current);
            speechTimerRef.current = null;
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
        }
        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = "";
        }
        if (audioContextRef.current) {
            audioContextRef.current.close?.().catch?.(() => {});
            audioContextRef.current = null;
        }
        setMood("idle");
    }, []);

    const speakCoachText = useCallback(async (text) => {
        if (!text) return false;
        stopSpeaking();
        intentionalStopRef.current = false;
        setMood("thinking");
        try {
            const audioBlob = await LearningAgentService.synthesizeCoachSpeech(text, { timeoutMs: 4500 });
            if (intentionalStopRef.current) return false;
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.volume = 1;
            audioRef.current = audio;
            audioUrlRef.current = audioUrl;
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                const audioContext = new AudioContextClass();
                const source = audioContext.createMediaElementSource(audio);
                const gain = audioContext.createGain();
                gain.gain.value = 1.6;
                source.connect(gain);
                gain.connect(audioContext.destination);
                audioContextRef.current = audioContext;
            }
            audio.onended = () => {
                if (audioUrlRef.current === audioUrl) {
                    URL.revokeObjectURL(audioUrl);
                    audioUrlRef.current = "";
                    audioRef.current = null;
                }
                if (audioContextRef.current) {
                    audioContextRef.current.close?.().catch?.(() => {});
                    audioContextRef.current = null;
                }
                setMood("idle");
            };
            audio.onerror = () => {
                const wasIntentionalStop = intentionalStopRef.current || audioRef.current !== audio;
                if (audioUrlRef.current === audioUrl) {
                    URL.revokeObjectURL(audioUrl);
                    audioUrlRef.current = "";
                    audioRef.current = null;
                }
                if (audioContextRef.current) {
                    audioContextRef.current.close?.().catch?.(() => {});
                    audioContextRef.current = null;
                }
                if (wasIntentionalStop) {
                    setMood("idle");
                    return;
                }
                speakBrowserCoachText(text, setMood);
            };
            setMood("talking");
            await audio.play();
            return true;
        } catch {
            if (intentionalStopRef.current) {
                setMood("idle");
                return false;
            }
            return speakBrowserCoachText(text, setMood);
        }
    }, [stopSpeaking]);

    useEffect(() => {
        setIsLoggedIn(AuthService.isAuthenticated());
    }, [location.pathname]);

    useEffect(() => {
        if (!isLoggedIn || lastFetchedMinutesRef.current === selectedTargetMinutes) return;
        lastFetchedMinutesRef.current = selectedTargetMinutes;
        setIsLoading(true);
        LearningAgentService.getDailyPlan(selectedTargetMinutes, { showAlert: false })
            .then(setPlan)
            .catch(() => setPlan(null))
            .finally(() => setIsLoading(false));
    }, [isLoggedIn, selectedTargetMinutes]);

    useEffect(() => {
        if (!isLoggedIn) return;
        autoSpeakKeyRef.current = "";
        const storedTask = sessionStorage.getItem(PENDING_TASK_SESSION_KEY);
        const shouldStartGuide = sessionStorage.getItem(START_GUIDE_SESSION_KEY) === "1";
        const isCoachGuideFlow = ["timeSetup", "timeConfirmed", "coachTour", "profilePrompt", "profileFocus", "planUpdated"].includes(guideMode);
        if (!storedTask) {
            if (isCoachPage && shouldStartGuide) {
                sessionStorage.removeItem(START_GUIDE_SESSION_KEY);
                setIsOpen(true);
                setGuideMode("timeSetup");
                setCurrentStep(0);
            } else if (isCoachPage) {
                if (isCoachGuideFlow && isOpen) return;
                setIsOpen(false);
                setGuideMode("coachTour");
            } else if (guideMode !== "welcome") {
                setIsOpen(false);
                setGuideMode("welcome");
            } else {
                if (isOpen) return;
                setIsOpen(false);
            }
            return;
        }

        try {
            const parsedTask = JSON.parse(storedTask);
            const taskPath = parsedTask?.action?.path;
            if (taskPath && location.pathname === taskPath) {
                setPendingTask(parsedTask);
                setGuideMode("taskReady");
                setIsOpen(true);
            } else if (taskPath && location.pathname !== "/coach") {
                sessionStorage.removeItem(PENDING_TASK_SESSION_KEY);
                setPendingTask(null);
                setGuideMode("welcome");
            } else if (isCoachPage && shouldStartGuide) {
                sessionStorage.removeItem(START_GUIDE_SESSION_KEY);
                setGuideMode("timeSetup");
                setCurrentStep(0);
                setIsOpen(true);
            }
        } catch {
            sessionStorage.removeItem(PENDING_TASK_SESSION_KEY);
            setPendingTask(null);
        }
    }, [guideMode, isCoachPage, isLoggedIn, isOpen, location.pathname]);

    useEffect(() => {
        if (!isLoggedIn) return undefined;

        const handleCoachPlanRefreshed = (event) => {
            stopSpeaking();
            setExternalCoachMessage(event.detail?.message || "Mình đã cập nhật hồ sơ của bạn. Kế hoạch hôm nay đã được điều chỉnh lại.");
            setGuideMode("planUpdated");
            setCurrentStep(0);
            setIsOpen(true);
        };

        window.addEventListener("easyTalk:coachPlanRefreshed", handleCoachPlanRefreshed);
        return () => {
            window.removeEventListener("easyTalk:coachPlanRefreshed", handleCoachPlanRefreshed);
        };
    }, [isLoggedIn, stopSpeaking]);

    useEffect(() => {
        if (!isLoggedIn) return undefined;

        const handleTargetMinutesPicked = (event) => {
            const minutes = event.detail?.minutes;
            if (!COACH_TARGET_MINUTES.includes(minutes)) return;
            setSelectedTargetMinutes(minutes);
            if (guideMode === "timeSetup") {
                autoSpeakKeyRef.current = "";
            }
        };

        window.addEventListener("easyTalk:coachTargetMinutesPicked", handleTargetMinutesPicked);
        return () => {
            window.removeEventListener("easyTalk:coachTargetMinutesPicked", handleTargetMinutesPicked);
        };
    }, [guideMode, isLoggedIn]);

    const guideMessage = useMemo(() => {
        if (guideMode === "taskReady") return getTaskReadyMessage(pendingTask);
        if (guideMode === "planUpdated") return externalCoachMessage;
        if (guideMode === "timeSetup") return getTimeSetupMessage(selectedTargetMinutes);
        if (guideMode === "timeConfirmed") return getTimeConfirmedMessage(selectedTargetMinutes);
        if (guideMode === "profilePrompt") return getProfilePromptMessage();
        if (guideMode === "profileFocus") return getProfileFocusMessage();
        if (guideMode === "coachTour") {
            if (activeTask && currentStep > 0) return getTaskReason(activeTask, currentStep, memory);
            return getCoachBriefing(plan, memory);
        }
        return `Chào ${getUserDisplayName()}, mình là AI Coach của EasyTalk. Hôm nay mình sẽ kèm bạn học gọn và đúng trọng tâm. Bạn có muốn xem kế hoạch học tập hôm nay không?`;
    }, [activeTask, currentStep, externalCoachMessage, guideMode, memory, pendingTask, plan, selectedTargetMinutes]);

    useEffect(() => {
        if (!isLoggedIn || !isOpen || isLoading || !["welcome", "timeSetup", "timeConfirmed", "coachTour", "profilePrompt", "profileFocus", "planUpdated"].includes(guideMode) || !guideMessage) return;
        const speakKey = `${guideMode}-${currentStep}-${guideMessage}`;
        if (autoSpeakKeyRef.current === speakKey) return;
        autoSpeakKeyRef.current = speakKey;
        speechTimerRef.current = window.setTimeout(() => {
            speechTimerRef.current = null;
            speakCoachText(guideMessage);
        }, 550);
    }, [currentStep, guideMessage, guideMode, isLoading, isLoggedIn, isOpen, speakCoachText]);

    useEffect(() => () => {
        stopSpeaking();
    }, [stopSpeaking]);

    const startTask = (task = activeTask) => {
        if (!task) return;
        sessionStorage.setItem(PENDING_TASK_SESSION_KEY, JSON.stringify(task));
        stopSpeaking();
        navigate(task.action?.path || "/coach");
    };

    const handleReadyToLearn = () => {
        sessionStorage.removeItem(PENDING_TASK_SESSION_KEY);
        setPendingTask(null);
        stopSpeaking();
        setIsOpen(false);
    };

    const showProfilePrompt = () => {
        stopSpeaking();
        setGuideMode("profilePrompt");
        setCurrentStep(tourSteps.length);
        setIsOpen(true);
    };

    const focusMemoryProfile = () => {
        stopSpeaking();
        setGuideMode("profileFocus");
        setCurrentStep(tourSteps.length);
        setIsOpen(true);
    };

    const applyTargetMinutes = async (minutes = selectedTargetMinutes, nextMode = "timeConfirmed") => {
        const nextMinutes = COACH_TARGET_MINUTES.includes(minutes) ? minutes : DEFAULT_TARGET_MINUTES;
        sessionStorage.setItem(TARGET_MINUTES_SESSION_KEY, String(nextMinutes));
        lastFetchedMinutesRef.current = nextMinutes;
        setSelectedTargetMinutes(nextMinutes);
        window.dispatchEvent(new CustomEvent("easyTalk:coachTargetMinutesChanged", {
            detail: { minutes: nextMinutes }
        }));
        stopSpeaking();
        setIsLoading(true);
        try {
            const nextPlan = await LearningAgentService.getDailyPlan(nextMinutes, { showAlert: false });
            setPlan(nextPlan);
        } catch {
            lastFetchedMinutesRef.current = null;
        } finally {
            setIsLoading(false);
            setGuideMode(nextMode);
            setCurrentStep(0);
            setIsOpen(true);
        }
    };

    const closeGuide = () => {
        stopSpeaking();
        setCurrentStep(0);
        if (guideMode === "welcome") {
            sessionStorage.setItem(WELCOME_SEEN_SESSION_KEY, "1");
        }
        if (guideMode === "taskReady") {
            sessionStorage.removeItem(PENDING_TASK_SESSION_KEY);
            setPendingTask(null);
            setGuideMode(isCoachPage ? "coachTour" : "welcome");
        }
        if (guideMode === "planUpdated") {
            setExternalCoachMessage("");
            setGuideMode(isCoachPage ? "coachTour" : "welcome");
        }
        setIsOpen(false);
    };

    if (!isLoggedIn) return null;

    const shouldShowLauncher = !isOpen || (
        isCoachPage
        && guideMode === "welcome"
        && sessionStorage.getItem(START_GUIDE_SESSION_KEY) !== "1"
        && !sessionStorage.getItem(PENDING_TASK_SESSION_KEY)
    );

    if (shouldShowLauncher) {
        return (
            <button
                className="coach-companion-launcher"
                type="button"
                onClick={() => {
                    if (isCoachPage) {
                        sessionStorage.setItem(START_GUIDE_SESSION_KEY, "1");
                        setGuideMode("timeSetup");
                        setCurrentStep(0);
                    } else {
                        sessionStorage.removeItem(WELCOME_SEEN_SESSION_KEY);
                        setGuideMode("welcome");
                        setCurrentStep(0);
                    }
                    setIsOpen(true);
                }}
                aria-label="Mở AI Coach"
            >
                <i className="fas fa-robot"></i>
                {remainingFlashcards > 0 && <em>{remainingFlashcards}</em>}
            </button>
        );
    }

    const isTour = guideMode === "coachTour";
    const isTaskReady = guideMode === "taskReady";
    const isTimeSetup = guideMode === "timeSetup";
    const isTimeConfirmed = guideMode === "timeConfirmed";
    const isProfilePrompt = guideMode === "profilePrompt";
    const isProfileFocus = guideMode === "profileFocus";
    const isPlanUpdated = guideMode === "planUpdated";
    const title = isTaskReady ? "Sẵn sàng học chưa?" : isPlanUpdated ? "Kế hoạch mới" : (isProfilePrompt || isProfileFocus) ? "Hồ sơ học tập" : isTimeSetup ? "Thiết lập thời gian học" : isTimeConfirmed ? "Đã thiết lập thời gian học" : isTour ? "Kế hoạch hôm nay" : "Chào mừng trở lại";
    const status = mood === "talking" ? "Đang nói" : mood === "thinking" ? "Đang tạo giọng" : "Sẵn sàng";

    return (
        <CoachGuideOverlay
            isOpen={isOpen}
            title={title}
            message={guideMessage}
            mood={mood}
            status={isLoading ? "Đang chuẩn bị" : status}
            targetKey={isTimeSetup ? "coach-time-setup" : isTour ? activeStep?.targetKey : isProfileFocus ? "coach-memory-profile" : isTaskReady ? getTaskTargetKey(pendingTask, location.pathname) : null}
            variant={isProfileFocus ? "pointer" : isPlanUpdated ? "compact" : "default"}
            steps={isTour ? tourSteps : []}
            currentStep={currentStep}
            onBack={() => setCurrentStep((step) => Math.max(0, step - 1))}
            onNext={() => setCurrentStep((step) => Math.min(tourSteps.length - 1, step + 1))}
            onStartStep={showProfilePrompt}
            finalStepLabel="Tiếp theo"
            minuteOptions={[]}
            selectedMinutes={selectedTargetMinutes}
            onSelectMinutes={setSelectedTargetMinutes}
            onClose={() => {
                closeGuide();
            }}
            onSpeak={() => speakCoachText(guideMessage)}
            onStop={stopSpeaking}
            primaryAction={
                guideMode === "welcome"
                    ? {
                        to: "/coach",
                        icon: "fas fa-clipboard-list",
                        label: "Xem kế hoạch hôm nay",
                        onClick: () => {
                            sessionStorage.setItem(START_GUIDE_SESSION_KEY, "1");
                            sessionStorage.setItem(WELCOME_SEEN_SESSION_KEY, "1");
                            setGuideMode("timeSetup");
                            setCurrentStep(0);
                            setIsOpen(true);
                        }
                    }
                    : isTimeSetup
                        ? {
                            icon: "fas fa-check-circle",
                            label: `Thiết lập ${selectedTargetMinutes} phút`,
                            onClick: () => applyTargetMinutes(selectedTargetMinutes)
                        }
                    : isTimeConfirmed
                        ? {
                            icon: "fas fa-arrow-right",
                            label: "Tiếp tục",
                            onClick: () => {
                                stopSpeaking();
                                setGuideMode("coachTour");
                                setCurrentStep(0);
                            }
                        }
                    : isProfilePrompt
                        ? {
                            icon: "fas fa-user-edit",
                            label: "Có, chỉnh hồ sơ",
                            onClick: focusMemoryProfile
                        }
                        : isProfileFocus
                        ? {
                            icon: "fas fa-check-circle",
                            label: "Tôi sẽ cập nhật",
                            onClick: closeGuide
                        }
                        : isPlanUpdated
                        ? {
                            icon: "fas fa-check-circle",
                            label: "Đã rõ",
                            onClick: closeGuide
                        }
                        : isTaskReady
                        ? {
                            icon: "fas fa-check-circle",
                            label: "Sẵn sàng học",
                            onClick: handleReadyToLearn
                        }
                        : {
                            icon: "fas fa-play",
                            label: "Bắt đầu bước này",
                            onClick: () => startTask(activeTask)
                        }
            }
            secondaryAction={
                guideMode === "welcome"
                    ? {
                        icon: "fas fa-clock",
                        label: "Để sau",
                        onClick: () => {
                            closeGuide();
                        }
                    }
                    : isTimeSetup
                        ? {
                            icon: "fas fa-forward",
                            label: "Bỏ qua chọn thời gian",
                            onClick: () => applyTargetMinutes(DEFAULT_TARGET_MINUTES, "coachTour")
                        }
                    : isTimeConfirmed
                        ? null
                    : isProfilePrompt
                        ? {
                            icon: "fas fa-times-circle",
                            label: "Không, bỏ qua",
                            onClick: closeGuide
                        }
                        : isProfileFocus
                        ? {
                            icon: "fas fa-times-circle",
                            label: "Tắt hướng dẫn",
                            onClick: closeGuide
                        }
                        : isTaskReady
                        ? {
                            icon: "fas fa-list",
                            label: "Quay lại kế hoạch",
                            onClick: () => {
                                sessionStorage.removeItem(PENDING_TASK_SESSION_KEY);
                                sessionStorage.setItem(START_GUIDE_SESSION_KEY, "1");
                                setPendingTask(null);
                                navigate("/coach");
                            }
                        }
                        : {
                            icon: "fas fa-question-circle",
                            label: "Vì sao bước này?",
                            onClick: () => speakCoachText(getTaskReason(activeTask, currentStep, memory))
                        }
            }
            tertiaryAction={
                isTimeSetup || isTimeConfirmed || isTour || isProfilePrompt || isProfileFocus
                    ? {
                        label: "Bỏ qua hướng dẫn",
                        onClick: () => {
                            closeGuide();
                        }
                    }
                    : null
            }
        />
    );
}

export default CoachCompanion;
