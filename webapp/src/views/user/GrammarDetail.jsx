import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, UNSAFE_NavigationContext } from "react-router-dom";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import GrammarSentence from "@/components/user/grammar/GrammarSentence.jsx";
import GrammarQuiz from "@/components/user/grammar/GrammarQuiz.jsx";
import GrammarComplete from "@/components/user/grammar/GrammarComplete.jsx";
import { GrammarService } from "@/services/GrammarService.jsx";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import Swal from "sweetalert2";

function GrammarDetail() {
    const { slug } = useParams();
    const { navigator } = React.useContext(UNSAFE_NavigationContext);
    const [grammar, setGrammar] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [displayContent, setDisplayContent] = useState("");
    const [showQuiz, setShowQuiz] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const allowNavigationRef = useRef(false);
    const [grammarCompleted, setGrammarCompleted] = useState(false);
    const contentRef = useRef(null);
    const [currentStep, setCurrentStep] = useState(0);
    const [totalSteps, setTotalSteps] = useState(1);
    const [activeTime, setActiveTime] = useState(0);
    const lastInteractionRef = useRef(Date.now());
    const intervalRef = useRef(null);
    const hasRecordedRef = useRef(false);

    const handleUserInteraction = useCallback(() => {
        lastInteractionRef.current = Date.now();
        if (!intervalRef.current) {
            startActiveTimer();
        }
    }, []);

    const startActiveTimer = useCallback(() => {
        if (intervalRef.current) return;
        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const inactiveSeconds = Math.floor((now - lastInteractionRef.current) / 1000);
            if (inactiveSeconds < 60) {
                setActiveTime(prev => prev + 1);
            } else {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }, 1000);
    }, []);

    useEffect(() => {
        const events = [
            'mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart',
            'click', 'keydown', 'keyup', 'touchmove'
        ];
        events.forEach(event => {
            window.addEventListener(event, handleUserInteraction, true);
        });
        startActiveTimer();
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleUserInteraction, true);
            });
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [handleUserInteraction, startActiveTimer]);

    useEffect(() => {
        if (!navigator || !displayContent || grammarCompleted) return;
        const originalPush = navigator.push;
        const originalReplace = navigator.replace;
        const handleNavigation = async (originalMethod, args) => {
            if (!allowNavigationRef.current && displayContent && !grammarCompleted) {
                const result = await Swal.fire({
                    icon: "warning",
                    title: "Cảnh báo",
                    text: "Bạn đang học giữa chừng. Nếu rời trang, tiến trình sẽ không được lưu. Bạn có chắc muốn rời đi?",
                    showCancelButton: true,
                    confirmButtonText: "Rời đi",
                    cancelButtonText: "Ở lại",
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
    }, [navigator, displayContent, grammarCompleted]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!grammarCompleted && displayContent) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [grammarCompleted, displayContent]);

    useEffect(() => {
        document.title = "Chi tiết bài học ngữ pháp - EasyTalk";
        const fetchGrammarDetail = async () => {
            setIsLoading(true);
            try {
                const res = await GrammarService.getGrammarBySlug(slug);
                if (res && res.grammar && res.grammar.content) {
                    setGrammar(res.grammar);
                    setTimeout(() => {
                        setDisplayContent(res.grammar.content);
                        setTimeout(() => {
                            if (contentRef.current) {
                                contentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                        }, 50);
                    }, 2000);
                }
            } catch (error) {
                console.error("Error fetching grammar:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGrammarDetail();
    }, [slug]);

    const handleStepChange = (step, total) => {
        setCurrentStep(step);
        setTotalSteps(total);
    };
    const progressPercent = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

    const handleComplete = async () => {
        try {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            const now = Date.now();
            const lastActiveSeconds = Math.floor((now - lastInteractionRef.current) / 1000);
            const finalActiveTime = activeTime + (lastActiveSeconds < 60 ? lastActiveSeconds : 0);
            if (finalActiveTime >= 60 && !hasRecordedRef.current) {
                await UserProgressService.recordStudyTime(finalActiveTime);
                hasRecordedRef.current = true;
            }
            await GrammarService.completeGrammar(grammar._id);
            setGrammarCompleted(true);
            Swal.fire({
                icon: "success",
                title: "Hoàn thành!",
                text: "Chúc mừng! Bạn đã hoàn thành bài học ngữ pháp. Bài học ngữ pháp tiếp theo đã được mở khóa.",
                confirmButtonText: "Quay lại danh sách bài học ngữ pháp",
            }).then(() => {
                window.location.href = "/grammar";
            });
        } catch (err) {
            console.error("Error completing grammar:", err);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Có lỗi xảy ra khi cập nhật tiến độ."
            });
        }
    };

    if (isLoading) { return <LoadingScreen />; }
    if (!grammar) return <p className="no-grammar">Đang tải bài học ngữ pháp ...</p>;

    return (
        <div className="lesson-detail-container container">
            <div className="lesson-detail-header my-4">
                <div className="section_tittle">
                    <h3>{grammar.title}</h3>
                </div>
                <p className="lesson-detail-description">{grammar.description}</p>
            </div>
            <div className="lesson-progress-container"> 
                <div
                    className="lesson-progress-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                >
                    {progressPercent}%
                </div>
            </div>
            <p className="lesson-step-counter">Step {currentStep} / {totalSteps}</p>
            <div ref={contentRef} className="lesson-content" style={{ display: showQuiz && !isComplete ? "none" : "block" }}>
                <GrammarSentence
                    content={displayContent}
                    onComplete={() => setShowQuiz(true)}
                    onStepChange={handleStepChange}
                />
            </div>
            {grammar.quizzes && (
                <div style={{ display: showQuiz ? "block" : "none" }}>
                    <GrammarQuiz
                        quizzes={grammar.quizzes}
                        onComplete={() => setIsComplete(true)}
                    />
                </div>
            )}
            {isComplete && (
                <GrammarComplete onComplete={handleComplete} />
            )}
        </div>
    );
}

export default GrammarDetail;