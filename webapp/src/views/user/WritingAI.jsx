import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { UNSAFE_NavigationContext } from "react-router-dom";
import { WritingAIService } from "@/services/WritingAIService.jsx";
import { LearningAgentService } from "@/services/LearningAgentService.jsx";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import WritingAIInput from "@/components/user/writingAI/WritingAIInput.jsx";
import WritingAIResult from "@/components/user/writingAI/WritingAIResult.jsx";
import Swal from "sweetalert2";

function WritingAI() {
    const { t, i18n } = useTranslation();
    const [topic, setTopic] = useState("");
    const [writingModes, setWritingModes] = useState([]);
    const [selectedMode, setSelectedMode] = useState(null);
    const [userText, setUserText] = useState("");
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { navigator } = useContext(UNSAFE_NavigationContext);
    const allowNavigationRef = useRef(false);
    const hasStarted = userText.trim().length > 0 && !analysisResult;

    const pickModeTopic = useCallback((mode) => {
        const topics = mode?.config?.topicSuggestions || [];
        if (!topics.length) return null;
        return topics[Math.floor(Math.random() * topics.length)];
    }, []);

    const fetchTopic = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const generatedTopic = await WritingAIService.getRandomTopic();
            setTopic(generatedTopic);
        } catch (err) {
            console.error("Error fetching topic:", err);
            setTopic(t("writingAIPage.alert.topicFailed"));
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [t]);

    const loadWritingSetup = useCallback(async () => {
        setIsLoading(true);
        try {
            const modes = await LearningAgentService.getModes("writing");
            setWritingModes(modes);
            const firstMode = modes[0] || null;
            setSelectedMode(firstMode);
            const modeTopic = pickModeTopic(firstMode);
            if (modeTopic) {
                setTopic(modeTopic);
            } else {
                await fetchTopic(false);
            }
        } catch (err) {
            console.error("Error loading writing modes:", err);
            await fetchTopic(false);
        } finally {
            setIsLoading(false);
        }
    }, [fetchTopic, pickModeTopic]);

    useEffect(() => {
        document.title = t("writingAIPage.documentTitle");
        loadWritingSetup();
    }, [loadWritingSetup, t, i18n.language]);

    const handleModeSelect = (mode) => {
        setSelectedMode(mode);
        setAnalysisResult(null);
        setUserText("");
        const modeTopic = pickModeTopic(mode);
        if (modeTopic) {
            setTopic(modeTopic);
        } else {
            fetchTopic(false);
        }
    };

    const handleSubmit = async () => {
        const trimmedText = userText.trim();
        if (!trimmedText)
            return Swal.fire({
                icon: "warning",
                title: t("writingAIPage.alert.noticeTitle"),
                text: t("writingAIPage.alert.emptyText"),
            });
        const minCharacters = selectedMode?.config?.minCharacters || 200;
        if (trimmedText.length < minCharacters) {
            return Swal.fire({
                icon: "warning",
                title: t("writingAIPage.alert.noticeTitle"),
                text: t("writingAIPage.alert.minCharacters", { count: minCharacters }),
            });
        }
        setIsSubmitting(true);
        try {
            const result = await WritingAIService.analyzeWriting(trimmedText, selectedMode?.key || null);
            setAnalysisResult(result);
        } catch (err) {
            console.error("Error analyzing writing:", err);
            Swal.fire({
                icon: "error",
                title: t("writingAIPage.alert.errorTitle"),
                text: t("writingAIPage.alert.analyzeFailed"),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = async () => {
        setUserText("");
        setAnalysisResult(null);
        const modeTopic = pickModeTopic(selectedMode);
        if (modeTopic) {
            setTopic(modeTopic);
        } else {
            fetchTopic();
        }
    };

    useEffect(() => {
        if (!navigator || !hasStarted) return;
        const originalPush = navigator.push;
        const originalReplace = navigator.replace;
        const handleNavigation = async (originalMethod, args) => {
            if (!allowNavigationRef.current && hasStarted) {
                const result = await Swal.fire({
                    icon: "warning",
                    title: t("writingAIPage.alert.warningTitle"),
                    text: t("writingAIPage.alert.leaveText"),
                    showCancelButton: true,
                    confirmButtonText: t("writingAIPage.alert.leaveConfirm"),
                    cancelButtonText: t("writingAIPage.alert.stayCancel"),
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

    if (isLoading) return <LoadingScreen />;

    return (
        <>
            <div className="container writingai-container" data-coach-target="agent-task-writing-workspace">
                <div className="writingai-header text-center mb-3">
                    <h3>{selectedMode?.title ? t("writingAIPage.header.modeTitle", { title: selectedMode.title }) : t("writingAIPage.header.defaultTitle")}
                    <i
                        className="fas fa-question-circle help-icon"
                        style={{ cursor: "pointer" }}
                        onClick={() => setIsModalOpen(true)}
                    ></i>
                    </h3>
                    {selectedMode?.description && <p className="agent-mode-subtitle">{selectedMode.description}</p>}
                </div>

                <div className="agent-mode-grid writing-mode-grid">
                    {writingModes.map((mode) => (
                        <button
                            key={mode.key}
                            className={`agent-mode-card ${selectedMode?.key === mode.key ? "active" : ""}`}
                            onClick={() => handleModeSelect(mode)}
                            disabled={isSubmitting}
                        >
                            <div className="agent-mode-card-top">
                                <span>{t("writingAIPage.modeCard.minutes", { count: mode.estimatedMinutes || 10 })}</span>
                                {mode.recommendedScore > 0 && <strong>{t("writingAIPage.modeCard.recommended")}</strong>}
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

                <WritingAIInput
                    topic={topic}
                    userText={userText}
                    setUserText={setUserText}
                    onSubmit={handleSubmit}
                    onReset={handleReset}
                    disabled={isSubmitting}
                    analysisResult={analysisResult}
                />

                <WritingAIResult analysisResult={analysisResult} />
            </div>
            {isModalOpen && (
                <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5>{t("writingAIPage.guide.title")}</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>{t("writingAIPage.guide.intro")}</p>
                            <p>
                                <strong>{t("writingAIPage.guide.stepsTitle")}</strong>
                            </p>
                            <ul>
                                <li><Trans i18nKey="writingAIPage.guide.stepWrite" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="writingAIPage.guide.stepSubmit" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="writingAIPage.guide.stepAnalyze" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="writingAIPage.guide.stepScore" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="writingAIPage.guide.stepContinue" components={{ strong: <strong /> }} /></li>
                            </ul>
                            <p><strong>{t("writingAIPage.guide.noteTitle")}</strong></p>
                            <ul>
                                <li>{t("writingAIPage.guide.noteWrite")}</li>
                                <li>{t("writingAIPage.guide.noteApply")}</li>
                            </ul>
                            <p>{t("writingAIPage.guide.closing")}</p>
                        </div>
                        <div className="custom-modal-footer">
                            <button className="footer-btn" onClick={() => setIsModalOpen(false)}>{t("writingAIPage.common.close")}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
        
    );
}

export default WritingAI;
