import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useParams, UNSAFE_NavigationContext } from 'react-router-dom';
import { StageService } from "@/services/StageService.jsx";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import StageCarousel from "@/components/user/stage/StageCarousel.jsx";
import StageResultScreen from "@/components/user/stage/StageResultScreen.jsx";
import StageHistory from "@/components/user/stage/StageHistory.jsx";
import Swal from "sweetalert2";

const Stage = () => {
    const { id } = useParams();
    const { navigator } = useContext(UNSAFE_NavigationContext);
    const allowNavigationRef = useRef(false);
    const [questions, setQuestions] = useState([]);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [questionResults, setQuestionResults] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [stageTitle, setStageTitle] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
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
        document.title = "Chặng hành trình - EasyTalk";
        const fetchStageData = async () => {
            try {
                setIsLoading(true);
                const data = await StageService.getStage(id);
                if (data && data.stage && data.stage.questions && data.stage.questions.length > 0) {
                    setQuestions(data.stage.questions);
                    setStageTitle(data.stage.title || "Bài học");
                    const initialResults = data.stage.questions.map(q => ({
                        question: q.question,
                        userAnswer: "Chưa trả lời",
                        correctAnswer: q.correctAnswer,
                        isCorrect: false,
                        explanation: q.explanation,
                        questionType: q.type
                    }));
                    setQuestionResults(initialResults);
                } else {
                    console.error("Không tìm thấy câu hỏi");
                }
            } catch (error) {
                console.error("Error fetching stage:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchStageData();
    }, [id]);

    const handleAnswerSubmit = useCallback((questionIndex, userAnswer, isCorrect) => {
        setHasStarted(true);
        setQuestionResults(prev => {
            const newResults = [...prev];
            newResults[questionIndex] = {
                ...newResults[questionIndex],
                userAnswer: userAnswer || "Không trả lời",
                isCorrect: isCorrect
            };
            return newResults;
        });
        if (isCorrect) setCorrectAnswers(prev => prev + 1);
    }, []);

    const handleQuestionNavigation = useCallback((index) => {
        setCurrentQuestionIndex(index);
    }, []);

    const handleSubmitStage = useCallback(async () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        const now = Date.now();
        const lastActiveSeconds = Math.floor((now - lastInteractionRef.current) / 1000);
        const finalActiveTime = activeTime + (lastActiveSeconds < 60 ? lastActiveSeconds : 0);
        await UserProgressService.recordStudyTime(finalActiveTime);
        hasRecordedRef.current = true;
        setIsCompleted(true);
        setShowResult(true);
        try {
            await StageService.completeStage(id);
        } catch (err) {
            console.error("Error completing stage:", err);
        }
    }, [id, activeTime]);

    const handleShowHistory = useCallback(() => {
        setShowHistory(true);
    }, []);
    
    const handleCloseHistory = useCallback(() => {
        setShowHistory(false);
    }, []);

    // const handleRestart = useCallback(() => {
    //     setCorrectAnswers(0);
    //     setCurrentQuestionIndex(0);
    //     setIsCompleted(false);
    //     setShowResult(false);
    //     setShowHistory(false);
    //     setHasStarted(false);
    //     const resetResults = questions.map(q => ({
    //         question: q.question,
    //         userAnswer: "Chưa trả lời",
    //         correctAnswer: q.correctAnswer,
    //         isCorrect: false,
    //         explanation: q.explanation,
    //         questionType: q.type
    //     }));
    //     setQuestionResults(resetResults);
    //     setActiveTime(0);
    //     lastInteractionRef.current = Date.now();
    //     hasRecordedRef.current = false;
    // }, [questions]);

    const speakText = useCallback((text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        } else {
            Swal.fire({
                icon: "warning",
                title: "Cảnh báo",
                text: "Trình duyệt của bạn không hỗ trợ Speech Synthesis."
            });
        }
    }, []);

    useEffect(() => {
        if (!navigator || isCompleted) return;
        const originalPush = navigator.push;
        const originalReplace = navigator.replace;
        const handleNavigation = async (originalMethod, args) => {
            if (!allowNavigationRef.current && !isCompleted) {
                const result = await Swal.fire({
                    icon: "warning",
                    title: "Cảnh báo",
                    text: "Bạn đang làm bài luyện tập. Nếu rời trang, tiến trình sẽ không được lưu. Bạn có chắc muốn rời đi?",
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
    }, [navigator, isCompleted]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!isCompleted) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isCompleted]);

    if (isLoading) { return <LoadingScreen />; }

    if (questions.length == 0) {
        return (
            <div className="exercise-container">
                <div className="exercise-no-questions">
                    <p>Không có câu hỏi nào trong stage này.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container exercise-main-container">
            <div className="row">
                <div className="col-md-12">
                    <div className="exercise-content-container">
                        {showResult ? (
                            <StageResultScreen
                                correctAnswers={correctAnswers}
                                totalQuestions={questions.length}
                                // onRestart={handleRestart}
                                onShowHistory={handleShowHistory}
                                onExit={() => window.location.href = '/journey'}
                            />
                        ) : (
                            <StageCarousel
                                questions={questions}
                                currentQuestionIndex={currentQuestionIndex}
                                onAnswerSubmit={handleAnswerSubmit}
                                onQuestionNavigation={handleQuestionNavigation}
                                onSpeakText={speakText}
                                questionResults={questionResults}
                                isCompleted={isCompleted}
                                onSubmitStage={handleSubmitStage}
                            />
                        )}
                    </div>
                </div>
            </div>
            <StageHistory
                show={showHistory}
                onClose={handleCloseHistory}
                questionResults={questionResults}
            />
        </div>
    );
};

export default Stage;