import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, UNSAFE_NavigationContext } from 'react-router-dom';
import { VocabularyExerciseService } from "@/services/VocabularyExerciseService.jsx";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import VocabularyExerciseSidebar from "@/components/user/vocabularyexercise/VocabularyExerciseSidebar.jsx";
import VocabularyExerciseCarousel from "@/components/user/vocabularyexercise/VocabularyExerciseCarousel.jsx";
import VocabularyExerciseResultScreen from "@/components/user/vocabularyexercise/VocabularyExerciseResultScreen.jsx";
import VocabularyExerciseHistory from "@/components/user/vocabularyexercise/VocabularyExerciseHistory.jsx";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

const VocabularyExerciseDetail = () => {
    const { t, i18n } = useTranslation();
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
    const [timer, setTimer] = useState(null);
    const [attemptId, setAttemptId] = useState(null);
    const [isStartingAttempt, setIsStartingAttempt] = useState(false);
    const [isFinishingAttempt, setIsFinishingAttempt] = useState(false);
    const allowNavigationRef = React.useRef(false);
    const [exerciseCompleted, setExerciseCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasStarted, setHasStarted] = useState(false);
    const [answeredCount, setAnsweredCount] = useState(0);
    const [activeTime, setActiveTime] = useState(0);
    const lastInteractionRef = useRef(Date.now());
    const intervalRef = useRef(null);
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
                    title: t("vocabularyExercisePage.detail.leaveWarningTitle"),
                    text: t("vocabularyExercisePage.detail.leaveWarningText"),
                    showCancelButton: true,
                    confirmButtonText: t("vocabularyExercisePage.detail.leaveConfirm"),
                    cancelButtonText: t("vocabularyExercisePage.detail.leaveCancel"),
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
    }, [navigator, hasStarted, exerciseCompleted, t]);

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
        document.title = t("vocabularyExercisePage.detail.documentTitle");
        const fetchExerciseData = async () => {
            try {
                setIsLoading(true);
                const data = await VocabularyExerciseService.getVocabularyExerciseBySlug(slug);
                if (data && data.questions && data.questions.length > 0) {
                    setExerciseId(data._id);
                    setQuestions(data.questions);
                    setExerciseTitle(data.title || t("vocabularyExercisePage.detail.defaultTitle"));
                    const initialResults = data.questions.map(question => ({
                        question: question.question,
                        userAnswer: t("vocabularyExercisePage.detail.unanswered"),
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
    }, [slug, t, i18n.language]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
    };

    const handleStartExercise = async () => {
        if (!exerciseId) return;
        try {
            setIsStartingAttempt(true);
            const attempt = await VocabularyExerciseService.startVocabularyExerciseAttempt(exerciseId);
            setAttemptId(attempt.attemptId);
            if (Array.isArray(attempt.questions) && attempt.questions.length > 0) {
                setQuestions(attempt.questions);
                setQuestionResults(attempt.questions.map(question => ({
                    question: question.question,
                    userAnswer: t("vocabularyExercisePage.detail.unanswered"),
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
            console.error("Error starting vocabulary exercise attempt:", error);
            Swal.fire({
                icon: "error",
                title: t("vocabularyExercisePage.detail.errorTitle"),
                text: error.message || t("vocabularyExercisePage.detail.startError")
            });
        } finally {
            setIsStartingAttempt(false);
        }
    };

    const handleCheckAnswer = useCallback(async (questionIndex, userAnswer) => {
        if (!attemptId) {
            throw new Error("Attempt has not been started.");
        }
        return await VocabularyExerciseService.checkVocabularyExerciseQuestion(attemptId, questionIndex, userAnswer);
    }, [attemptId]);

    const handleAnswerSubmit = useCallback((questionIndex, result) => {
        setQuestionResults(prev => {
            const newResults = [...prev];
            newResults[questionIndex] = {
                ...newResults[questionIndex],
                userAnswer: result.userAnswer || t("vocabularyExercisePage.detail.noAnswer"),
                correctAnswer: result.correctAnswer,
                isCorrect: result.isCorrect,
                explanation: result.explanation
            };
            return newResults;
        });
        if (typeof result.correctCount === "number") {
            setCorrectAnswers(result.correctCount);
        } else if (result.isCorrect) {
            setCorrectAnswers(prev => prev + 1);
        }
    }, [t]);

    const handleQuestionNavigation = useCallback((index) => {
        setCurrentQuestionIndex(index);
    }, []);

    const handleSubmitQuiz = useCallback(async () => {
        if (timer) {
            clearInterval(timer);
        }
        if (attemptId && !hasFinishedAttemptRef.current) {
            try {
                setIsFinishingAttempt(true);
                const summary = await VocabularyExerciseService.finishVocabularyExerciseAttempt(attemptId);
                if (typeof summary.correctCount === "number") {
                    setCorrectAnswers(summary.correctCount);
                } else if (typeof summary.correctAnswers === "number") {
                    setCorrectAnswers(summary.correctAnswers);
                }
                hasFinishedAttemptRef.current = true;
            } catch (error) {
                console.error("Error finishing vocabulary exercise attempt:", error);
                Swal.fire({
                    icon: "error",
                    title: t("vocabularyExercisePage.detail.errorTitle"),
                    text: error.message || t("vocabularyExercisePage.detail.submitError")
                });
                return;
            } finally {
                setIsFinishingAttempt(false);
            }
        }
        setIsCompleted(true);
        setShowResult(true);
    }, [timer, attemptId, t]);

    useEffect(() => {
        if (!isCompleted && hasStarted && questions.length > 0) {
            const timerInterval = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timerInterval);
                        handleSubmitQuiz();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            setTimer(timerInterval);
            return () => {
                if (timerInterval) {
                    clearInterval(timerInterval);
                }
            };
        }
    }, [isCompleted, hasStarted, questions.length, handleSubmitQuiz]);

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
                title: t("vocabularyExercisePage.detail.warningTitle"),
                text: t("vocabularyExercisePage.detail.speechUnsupported")
            });
        }
    }, [t]);

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
            await VocabularyExerciseService.completeVocabularyExercise(exerciseId);
            setExerciseCompleted(true);
            Swal.fire({
                icon: "success",
                title: t("vocabularyExercisePage.detail.completeTitle"),
                text: t("vocabularyExercisePage.detail.completeText"),
                confirmButtonText: t("vocabularyExercisePage.detail.completeConfirm"),
            }).then(() => {
                window.location.href = "/vocabulary-exercise";
            });
        } catch (err) {
            console.error("Error completing vocabulary exercise:", err);
            Swal.fire({
                icon: "error",
                title: t("vocabularyExercisePage.detail.errorTitle"),
                text: t("vocabularyExercisePage.detail.errorText")
            });
        }
    };

    if (isLoading) { return <LoadingScreen />; }

    if (questions.length == 0) {
        return (
            <div className="exercise-container">
                <div className="exercise-no-questions">
                    <p>{t("vocabularyExercisePage.detail.noQuestions")}</p>
                </div>
            </div>
        );
    }

    if (!hasStarted) {
        return (
            <div className="exercise-start-container">
                <div className="exercise-card-start">
                    <h3 className="exercise-title">{exerciseTitle}</h3>
                    <div className="exercise-time-setup">
                        <label className="exercise-label">{t("vocabularyExercisePage.detail.chooseTime")}</label>
                        <select
                            className="form-control exercise-select"
                            value={selectedDuration}
                            onChange={(e) => setSelectedDuration(parseInt(e.target.value))}
                        >
                            <option value={10 * 60}>{t("vocabularyExercisePage.detail.minutes", { count: 10 })}</option>
                            <option value={20 * 60}>{t("vocabularyExercisePage.detail.minutes", { count: 20 })}</option>
                            <option value={30 * 60}>{t("vocabularyExercisePage.detail.minutes", { count: 30 })}</option>
                            <option value={40 * 60}>{t("vocabularyExercisePage.detail.minutes", { count: 40 })}</option>
                        </select>
                    </div>
                    <button
                        className="btn_1 mt-4"
                        onClick={() => {
                            handleStartExercise();
                        }}
                        disabled={isStartingAttempt}
                    >
                        <i className="fas fa-play"></i> {isStartingAttempt ? t("vocabularyExercisePage.detail.loading") : t("vocabularyExercisePage.detail.start")}
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
                            <VocabularyExerciseResultScreen
                                correctAnswers={correctAnswers}
                                totalQuestions={questions.length}
                                onComplete={handleComplete}
                            />
                        ) : (
                            <VocabularyExerciseCarousel
                                questions={questions}
                                currentQuestionIndex={currentQuestionIndex}
                                onCheckAnswer={handleCheckAnswer}
                                onAnswerSubmit={handleAnswerSubmit}
                                onQuestionNavigation={handleQuestionNavigation}
                                onSpeakText={speakText}
                                questionResults={questionResults}
                                isCompleted={isCompleted}
                                onAnsweredQuestionsChange={setAnsweredCount}
                            />
                        )}
                    </div>
                </div>
                
                <div className="col-md-5">
                    <VocabularyExerciseSidebar
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
                        answeredCount={answeredCount}
                        isSubmitting={isFinishingAttempt}
                    />
                </div>
            </div>

            <VocabularyExerciseHistory
                show={showHistory}
                onClose={handleCloseHistory}
                questionResults={questionResults}
            />
        </div>
    );
};

export default VocabularyExerciseDetail;
