import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, UNSAFE_NavigationContext } from 'react-router-dom';
import { PronunciationExerciseService } from "@/services/PronunciationExerciseService.jsx";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import PronunciationExerciseSidebar from "@/components/user/pronunciationexercise/PronunciationExerciseSidebar.jsx";
import PronunciationExerciseCarousel from "@/components/user/pronunciationexercise/PronunciationExerciseCarousel.jsx";
import PronunciationExerciseResultScreen from "@/components/user/pronunciationexercise/PronunciationExerciseResultScreen.jsx";
import PronunciationExerciseHistory from "@/components/user/pronunciationexercise/PronunciationExerciseHistory.jsx";
import Swal from "sweetalert2";

const PronunciationExerciseDetail = () => {
    const { slug } = useParams();
    const [exerciseId, setExerciseId] = useState(null);
    const { navigator } = React.useContext(UNSAFE_NavigationContext);
    const [questions, setQuestions] = useState([]);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [selectedDuration, setSelectedDuration] = useState(20 * 60);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [questionResults, setQuestionResults] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [exerciseTitle, setExerciseTitle] = useState("");
    const [attemptId, setAttemptId] = useState(null);
    const [isStartingAttempt, setIsStartingAttempt] = useState(false);
    const [isFinishingAttempt, setIsFinishingAttempt] = useState(false);
    const allowNavigationRef = React.useRef(false);
    const [exerciseCompleted, setExerciseCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasStarted, setHasStarted] = useState(false);
    const [activeTime, setActiveTime] = useState(0);
    const lastInteractionRef = useRef(Date.now());
    const intervalRef = useRef(null);
    const quizTimerRef = useRef(null);
    const hasRecordedRef = useRef(false);
    const hasFinishedAttemptRef = useRef(false);

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

    const handleUserInteraction = useCallback(() => {
        lastInteractionRef.current = Date.now();
        if (!intervalRef.current) {
            startActiveTimer();
        }
    }, [startActiveTimer]);

    const handleSubmitQuiz = useCallback(async () => {
        if (quizTimerRef.current) {
            clearInterval(quizTimerRef.current);
            quizTimerRef.current = null;
        }
        if (attemptId && !hasFinishedAttemptRef.current) {
            try {
                setIsFinishingAttempt(true);
                const summary = await PronunciationExerciseService.finishPronunciationExerciseAttempt(attemptId);
                if (typeof summary.correctCount === "number") {
                    setCorrectAnswers(summary.correctCount);
                } else if (typeof summary.correctAnswers === "number") {
                    setCorrectAnswers(summary.correctAnswers);
                }
                hasFinishedAttemptRef.current = true;
            } catch (error) {
                console.error("Error finishing pronunciation exercise attempt:", error);
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: error.message || "Có lỗi xảy ra khi nộp bài."
                });
                return;
            } finally {
                setIsFinishingAttempt(false);
            }
        }
        setIsCompleted(true);
        setShowResult(true);
    }, [attemptId]);

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
        if (!navigator || !hasStarted || exerciseCompleted) return;
        const originalPush = navigator.push;
        const originalReplace = navigator.replace;
        const handleNavigation = async (originalMethod, args) => {
            if (!allowNavigationRef.current && hasStarted && !exerciseCompleted) {
                const result = await Swal.fire({
                    icon: "warning",
                    title: "Cảnh báo",
                    text: "Bạn đang làm bài luyện phát âm. Nếu rời trang, tiến trình sẽ không được lưu. Bạn có chắc muốn rời đi?",
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
    }, [navigator, hasStarted, exerciseCompleted]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!exerciseCompleted && hasStarted) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [exerciseCompleted, hasStarted]);

    useEffect(() => {
        document.title = "Chi tiết luyện tập phát âm - EasyTalk";
        const fetchExerciseData = async () => {
            try {
                setIsLoading(true);
                const data = await PronunciationExerciseService.getPronunciationExerciseBySlug(slug);
                if (data && data.questions && data.questions.length > 0) {
                    setExerciseId(data._id);
                    setQuestions(data.questions);
                    setExerciseTitle(data.title || "Bài luyện tập phát âm");
                    const initialResults = data.questions.map(question => ({
                        question: question.question,
                        userAnswer: "Chưa trả lời",
                        correctAnswer: null,
                        isCorrect: false,
                        explanation: null,
                        questionType: question.type
                    }));
                    setQuestionResults(initialResults);
                } else {
                    console.error('No questions found');
                }
            } catch (error) {
                console.error('Error fetching exercise:', error);
            } finally {
                setIsLoading(false);
            }
        };
        if (slug) {
            fetchExerciseData();
        }
    }, [slug]);

    useEffect(() => {
        if (!isCompleted && hasStarted && questions.length > 0) {
            const timerInterval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timerInterval);
                        quizTimerRef.current = null;
                        handleSubmitQuiz();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            quizTimerRef.current = timerInterval;
            return () => {
                if (timerInterval) {
                    clearInterval(timerInterval);
                    if (quizTimerRef.current === timerInterval) {
                        quizTimerRef.current = null;
                    }
                }
            };
        }
    }, [isCompleted, hasStarted, questions, handleSubmitQuiz]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
    };

    const handleStartExercise = async () => {
        if (!exerciseId) return;
        try {
            setIsStartingAttempt(true);
            const attempt = await PronunciationExerciseService.startPronunciationExerciseAttempt(exerciseId);
            setAttemptId(attempt.attemptId);
            if (Array.isArray(attempt.questions) && attempt.questions.length > 0) {
                setQuestions(attempt.questions);
                setQuestionResults(attempt.questions.map(question => ({
                    question: question.question,
                    userAnswer: "Chưa trả lời",
                    correctAnswer: null,
                    isCorrect: false,
                    explanation: null,
                    questionType: question.type
                })));
                setCurrentQuestionIndex(0);
            }
            setTimeRemaining(selectedDuration);
            setHasStarted(true);
        } catch (error) {
            console.error("Error starting pronunciation exercise attempt:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.message || "Có lỗi xảy ra khi bắt đầu bài luyện tập."
            });
        } finally {
            setIsStartingAttempt(false);
        }
    };

    const handleCheckAnswer = useCallback(async (questionIndex, userAnswer) => {
        if (!attemptId) {
            throw new Error("Attempt has not been started.");
        }
        return await PronunciationExerciseService.checkPronunciationExerciseQuestion(attemptId, questionIndex, userAnswer);
    }, [attemptId]);

    const handleAnalyzePronunciation = useCallback(async (questionIndex, audioBlob) => {
        if (!attemptId) {
            throw new Error("Attempt has not been started.");
        }
        return await PronunciationExerciseService.analyzePronunciationAttemptQuestion(attemptId, questionIndex, audioBlob);
    }, [attemptId]);

    const handleAnswerSubmit = useCallback((questionIndex, result) => {
        setQuestionResults(prev => {
            const newResults = [...prev];
            newResults[questionIndex] = {
                ...newResults[questionIndex],
                userAnswer: result.userAnswer || result.transcription || "Không trả lời",
                transcription: result.transcription || "",
                correctAnswer: result.correctAnswer,
                isCorrect: result.isCorrect,
                explanation: result.explanation,
                accuracy: result.accuracy ?? null,
                detailedResult: result.detailedResult || []
            };
            return newResults;
        });
        if (typeof result.correctCount === "number") {
            setCorrectAnswers(result.correctCount);
        } else if (result.isCorrect) {
            setCorrectAnswers(prev => prev + 1);
        }
    }, []);

    const handleQuestionNavigation = useCallback((index) => {
        setCurrentQuestionIndex(index);
    }, []);

    const handleShowHistory = useCallback(() => {
        setShowHistory(true);
    }, []);

    const handleCloseHistory = useCallback(() => {
        setShowHistory(false);
    }, []);

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

    if (isLoading) { return <LoadingScreen />; }

    if (questions.length == 0) {
        return (
            <div className="exercise-container">
                <div className="exercise-no-questions">
                    <p>Không có câu hỏi nào trong bài tập này.</p>
                </div>
            </div>
        );
    }

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
            await PronunciationExerciseService.completePronunciationExercise(exerciseId);
            setExerciseCompleted(true);
            Swal.fire({
                icon: "success",
                title: "Hoàn thành!",
                text: "Chúc mừng! Bạn đã hoàn thành bài luyện tập phát âm. Bài luyện tập phát âm tiếp theo đã được mở khóa.",
                confirmButtonText: "Quay lại danh sách bài luyện tập phát âm",
            }).then(() => {
                window.location.href = "/pronunciation-exercise";
            });
        } catch (err) {
            console.error("Error completing pronunciation exercise:", err);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Có lỗi xảy ra khi cập nhật tiến độ."
            });
        }
    };

    if (!hasStarted) {
        return (
            <div className="exercise-start-container">
                <div className="exercise-card-start">
                    <h3 className="exercise-title">{exerciseTitle}</h3>
                    <div className="exercise-time-setup">
                        <label className="exercise-label">Chọn thời gian làm bài:</label>
                        <select
                            className="form-control exercise-select"
                            value={selectedDuration}
                            onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                        >
                            <option value={10 * 60}>10 phút</option>
                            <option value={20 * 60}>20 phút</option>
                            <option value={30 * 60}>30 phút</option>
                            <option value={40 * 60}>40 phút</option>
                        </select>
                    </div>
                    <button
                        className="btn_1 mt-4"
                        onClick={handleStartExercise}
                        disabled={isStartingAttempt}
                    >
                        <i className="fas fa-play"></i> {isStartingAttempt ? "Đang tải..." : "Bắt đầu"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container exercise-main-container">
            <div className="row">
                <div className="col-md-7">
                    <div className="exercise-content-container">
                        {showResult ? (
                            <PronunciationExerciseResultScreen
                                correctAnswers={correctAnswers}
                                totalQuestions={questions.length}
                                onComplete={handleComplete}
                            />
                        ) : (
                            <PronunciationExerciseCarousel
                                exerciseId={exerciseId}
                                questions={questions}
                                currentQuestionIndex={currentQuestionIndex}
                                onCheckAnswer={handleCheckAnswer}
                                onAnalyzePronunciation={handleAnalyzePronunciation}
                                onAnswerSubmit={handleAnswerSubmit}
                                onQuestionNavigation={handleQuestionNavigation}
                                onSpeakText={speakText}
                                questionResults={questionResults}
                                isCompleted={isCompleted}
                            />
                        )}
                    </div>
                </div>
                
                <div className="col-md-5">
                    <PronunciationExerciseSidebar
                        timeRemaining={timeRemaining}
                        formatTime={formatTime}
                        questions={questions}
                        questionResults={questionResults}
                        currentQuestionIndex={currentQuestionIndex}
                        isCompleted={isCompleted}
                        onSubmitQuiz={handleSubmitQuiz}
                        onQuestionNavigation={handleQuestionNavigation}
                        onShowHistory={handleShowHistory}
                        selectedDuration={selectedDuration}
                        isSubmitting={isFinishingAttempt}
                    />
                </div>
            </div>

            <PronunciationExerciseHistory
                show={showHistory}
                onClose={handleCloseHistory}
                questionResults={questionResults}
            />
        </div>
    );
};

export default PronunciationExerciseDetail;
