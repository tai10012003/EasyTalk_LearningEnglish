import React, { useState, useEffect, useRef, useContext } from "react";
import { Trans, useTranslation } from "react-i18next";
import { UNSAFE_NavigationContext } from "react-router-dom";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import ChatAIMessage from "@/components/user/chatAI/ChatAIMessage.jsx";
import ChatAIInput from "@/components/user/chatAI/ChatAIInput.jsx";
import { LearningAgentService } from "@/services/LearningAgentService.jsx";
import Swal from "sweetalert2";

function ChatAI() {
    const { t, i18n } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [chatModes, setChatModes] = useState([]);
    const [selectedMode, setSelectedMode] = useState(null);
    const [sessionSummary, setSessionSummary] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lastBotText, setLastBotText] = useState("");
    const [speakingWordIndex, setSpeakingWordIndex] = useState(null);
    const [isFirstMessage, setIsFirstMessage] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [isStarting, setIsStarting] = useState(false);
    const hasStarted = messages.length > 0 && !sessionSummary;
    const allowNavigationRef = useRef(false);
    const { navigator } = useContext(UNSAFE_NavigationContext);

    useEffect(() => {
        document.title = t("chatAIPage.documentTitle");
    }, [t, i18n.language]);

    useEffect(() => {
        const loadModes = async () => {
            try {
                const modes = await LearningAgentService.getModes("chat");
                setChatModes(modes);
                setSelectedMode(modes[0] || {
                    key: "speaking_practice",
                    title: t("chatAIPage.modes.fallbackTitle"),
                    description: t("chatAIPage.modes.fallbackDescription"),
                    skillFocus: ["speaking"],
                    estimatedMinutes: 10
                });
            } catch (err) {
                console.error("Error loading chat modes:", err);
                setSelectedMode({
                    key: "speaking_practice",
                    title: t("chatAIPage.modes.fallbackTitle"),
                    description: t("chatAIPage.modes.fallbackDescription"),
                    skillFocus: ["speaking"],
                    estimatedMinutes: 10
                });
            } finally {
                setIsLoading(false);
            }
        };
        loadModes();
    }, [t, i18n.language]);

    useEffect(() => {
        if (lastBotText && !isFirstMessage) {
            speakText(lastBotText);
        }
    }, [lastBotText, isFirstMessage]);

    useEffect(() => {
        const chatBox = document.getElementById("chat-ai-box");
        if (chatBox) {
            chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
        }
    }, [messages]);

    useEffect(() => {
        if (!navigator || !hasStarted) return;
        const originalPush = navigator.push;
        const originalReplace = navigator.replace;
        const handleNavigation = async (originalMethod, args) => {
            if (!allowNavigationRef.current && hasStarted) {
                const result = await Swal.fire({
                    icon: "warning",
                    title: t("chatAIPage.alert.warningTitle"),
                    text: t("chatAIPage.alert.leaveConversationText"),
                    showCancelButton: true,
                    confirmButtonText: t("chatAIPage.alert.leaveConfirm"),
                    cancelButtonText: t("chatAIPage.alert.stayCancel"),
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                });
                if (result.isConfirmed) {
                    allowNavigationRef.current = true;
                    originalMethod.apply(navigator, args);
                }
            } else {
                originalMethod.apply(navigator, args);
            }
        };
        navigator.push = (...args) => handleNavigation(originalPush, args);
        navigator.replace = (...args) => handleNavigation(originalReplace, args);
        return () => {
            navigator.push = originalPush;
            navigator.replace = originalReplace;
        };
    }, [navigator, hasStarted, t]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasStarted) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [hasStarted]);

    const speakText = (text) => {
        if (!window.speechSynthesis) return;
        let cleanText = text.replace(/<[^>]+>/g, "");
        cleanText = cleanText.replace(
            /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDDFF])/g,
            ""
        );
        const utterance = new SpeechSynthesisUtterance(cleanText.trim());
        utterance.lang = "en-US";
        utterance.rate = 1;
        utterance.pitch = 1;

        const words = cleanText.trim().split(" ");
        utterance.onboundary = (event) => {
            if (event.name == "word" || event.name == "text") {
                let charIndex = event.charIndex;
                let count = 0;
                for (let i = 0; i < words.length; i++) {
                    count += words[i].length + 1;
                    if (charIndex < count) {
                        setSpeakingWordIndex(i);
                        break;
                    }
                }
            }
        };

        utterance.onend = () => {
            setSpeakingWordIndex(null);
        };
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const handleSendMessage = async (text) => {
        if (!sessionId) {
            return Swal.fire({
                icon: "warning",
                title: t("chatAIPage.alert.notReadyTitle"),
                text: t("chatAIPage.alert.notReadyText"),
            });
        }
        if (isSending)
            return Swal.fire({
                icon: "warning",
                title: t("chatAIPage.alert.warningTitle"),
                text: t("chatAIPage.alert.sendingText"),
            });
        setIsSending(true);
        setMessages((prev) => [...prev, { sender: "user", text }]);
        try {
            const data = await LearningAgentService.sendChatMessage(sessionId, text);
            setMessages((prev) => [
                ...prev,
                {
                    sender: "bot",
                    text: data.reply || "...",
                    suggestion: formatSuggestions(data.suggestions),
                    corrections: data.corrections || []
                },
            ]);
            setLastBotText(data.reply || "...");
        } catch (error) {
            console.error("Error sending agent chat message:", error);
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: t("chatAIPage.alert.sendFailedText") },
            ]);
        } finally {
            setIsSending(false);
        }
    };

    const handleStartSession = async (mode) => {
        setIsStarting(true);
        setSelectedMode(mode);
        try {
            const data = await LearningAgentService.startChatSession({
                mode: mode.key
            });
            setSessionId(data.sessionId);
            setSelectedMode(data.modeConfig || mode);
            setMessages([{ sender: "bot", text: data.reply, suggestion: formatSuggestions(data.suggestions) }]);
            setLastBotText(data.reply);
            speakText(data.reply);
            setIsFirstMessage(false);
        } catch (err) {
            console.error("Error starting conversation:", err);
            Swal.fire({
                icon: "error",
                title: t("chatAIPage.alert.startFailedTitle"),
                text: t("chatAIPage.alert.tryAgainLater"),
            });
        } finally {
            setIsStarting(false);
        }
    };

    const formatSuggestions = (suggestions) => {
        if (!suggestions) return "";
        if (Array.isArray(suggestions)) {
            return suggestions.map((item, index) => `${index + 1}. ${item}`).join("\n");
        }
        return suggestions;
    };

    const handleFinishSession = async () => {
        if (!sessionId || isSending) return;
        const result = await Swal.fire({
            icon: "question",
            title: t("chatAIPage.finish.confirmTitle"),
            text: t("chatAIPage.finish.confirmText"),
            showCancelButton: true,
            confirmButtonText: t("chatAIPage.finish.confirmButton"),
            cancelButtonText: t("chatAIPage.finish.cancelButton"),
        });
        if (!result.isConfirmed) return;
        setIsSending(true);
        try {
            const summary = await LearningAgentService.finishChatSession(sessionId);
            setSessionSummary(summary);
            allowNavigationRef.current = true;
            Swal.fire({
                icon: "success",
                title: t("chatAIPage.finish.savedTitle"),
                text: summary.summary || t("chatAIPage.finish.savedText"),
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: t("chatAIPage.finish.failedTitle"),
                text: error.message || t("chatAIPage.alert.tryAgain"),
            });
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) return <LoadingScreen />;

    if (!sessionId) {
        const modes = chatModes.length ? chatModes : [selectedMode].filter(Boolean);
        return (
            <div className="container chat-ai-container" data-coach-target="agent-task-chat-workspace">
                <div className="chat-ai-header text-center">
                    <h3>{t("chatAIPage.modeSelect.title")}</h3>
                    <p className="agent-mode-subtitle">{t("chatAIPage.modeSelect.subtitle")}</p>
                </div>
                <div className="agent-mode-grid">
                    {modes.map((mode) => (
                        <button
                            key={mode.key}
                            className={`agent-mode-card ${selectedMode?.key === mode.key ? "active" : ""}`}
                            onClick={() => handleStartSession(mode)}
                            disabled={isStarting}
                        >
                            <div className="agent-mode-card-top">
                                <span>{t("chatAIPage.modeSelect.minutes", { count: mode.estimatedMinutes || 10 })}</span>
                                {mode.recommendedScore > 0 && <strong>{t("chatAIPage.modeSelect.recommended")}</strong>}
                            </div>
                            <h4>{mode.title}</h4>
                            <p>{mode.description}</p>
                            <div className="agent-mode-skills">
                                {(mode.skillFocus || []).slice(0, 3).map((skill) => (
                                    <span key={skill}>{skill}</span>
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="container chat-ai-container" data-coach-target="agent-task-chat-workspace">
                <div className="chat-ai-header text-center">
                    <h3>{selectedMode?.title || "AI Coach Chat"}
                        <i
                            className="fas fa-question-circle help-icon"
                            style={{ cursor: "pointer" }}
                            onClick={() => setIsModalOpen(true)}
                        ></i>
                    </h3>
                    {selectedMode?.description && <p className="agent-mode-subtitle">{selectedMode.description}</p>}
                    <button
                        className="chat-ai-finish-btn"
                        onClick={handleFinishSession}
                        disabled={isSending || !sessionId || !!sessionSummary}
                    >
                        <i className="fas fa-flag-checkered"></i> {t("chatAIPage.finish.button")}
                    </button>
                </div>
                <div id="chat-ai-box" className="chat-ai-box">
                    {messages.map((msg, idx) => (
                        <ChatAIMessage
                            key={idx}
                            message={msg}
                            speakingWordIndex={
                                msg.sender == "bot" && idx == messages.length - 1
                                    ? speakingWordIndex
                                    : null
                            }
                        />
                    ))}
                    {sessionSummary && (
                        <div className="chat-ai-summary-card">
                            <h4>{t("chatAIPage.summary.title")}</h4>
                            <p>{sessionSummary.summary}</p>
                            {sessionSummary.mistakes?.length > 0 && (
                                <>
                                    <strong>{t("chatAIPage.summary.mistakes")}</strong>
                                    <ul>
                                        {sessionSummary.mistakes.map((mistake, index) => (
                                            <li key={index}>{mistake}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                            {sessionSummary.recommendedNextActions?.length > 0 && (
                                <>
                                    <strong>{t("chatAIPage.summary.nextActions")}</strong>
                                    <ul>
                                        {sessionSummary.recommendedNextActions.map((action, index) => (
                                            <li key={index}>{action.title}</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <ChatAIInput onSend={handleSendMessage} disabled={isSending || !!sessionSummary} />
            </div>
            {isModalOpen && (
                <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5>{t("chatAIPage.guide.title")}</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>
                                <Trans
                                    i18nKey="chatAIPage.guide.intro"
                                    components={{ strong: <strong /> }}
                                />
                            </p>
                            <p>
                                <strong>{t("chatAIPage.guide.stepsTitle")}</strong>
                            </p>
                            <ul>
                                <li><Trans i18nKey="chatAIPage.guide.stepChat" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="chatAIPage.guide.stepReply" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="chatAIPage.guide.stepListen" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="chatAIPage.guide.stepHighlight" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="chatAIPage.guide.stepContinue" components={{ strong: <strong /> }} /></li>
                            </ul>
                            <p><strong>{t("chatAIPage.guide.noteTitle")}</strong></p>
                            <ul>
                                <li>{t("chatAIPage.guide.noteListen")}</li>
                                <li>{t("chatAIPage.guide.notePractice")}</li>
                            </ul>
                            <p>{t("chatAIPage.guide.closing")}</p>
                        </div>
                        <div className="custom-modal-footer">
                            <button className="footer-btn" onClick={() => setIsModalOpen(false)}>{t("chatAIPage.common.close")}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ChatAI;
