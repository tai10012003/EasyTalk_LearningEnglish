import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { GrammarExerciseService } from "../../services/GrammarExerciseService";
import GrammarExerciseSidebar from "../../components/user/grammarexercise/GrammarExerciseSidebar";
import GrammarExerciseCarousel from "../../components/user/grammarexercise/GrammarExerciseCarousel";
import GrammarExerciseResultScreen from "../../components/user/grammarexercise/GrammarExerciseResultScreen";
import GrammarExerciseHistory from "../../components/user/grammarexercise/GrammarExerciseHistory";

const GrammarExerciseDetail = () => {
    const { id } = useParams();
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
    const [loading, setLoading] = useState(true);
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        document.title = "Chi tiết luyện tập ngữ pháp - EasyTalk";
        const fetchExerciseData = async () => {
            try {
                setLoading(true);
                const data = await GrammarExerciseService.getGrammarExerciseById(id);
                
                if (data && data.questions && data.questions.length > 0) {
                    setQuestions(data.questions);
                    setExerciseTitle(data.title || "Bài luyện tập ngữ pháp");
                    const initialResults = data.questions.map(question => ({
                        question: question.question,
                        userAnswer: "Chưa trả lời",
                        correctAnswer: question.correctAnswer,
                        isCorrect: false,
                        explanation: question.explanation,
                        questionType: question.type
                    }));
                    setQuestionResults(initialResults);
                } else {
                    console.error('No questions found');
                }
            } catch (error) {
                console.error('Error fetching exercise:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchExerciseData();
        }
    }, [id]);

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
    }, [isCompleted, hasStarted, questions]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
    };

    const handleAnswerSubmit = useCallback((questionIndex, userAnswer, isCorrect) => {
        setQuestionResults(prev => {
            const newResults = [...prev];
            newResults[questionIndex] = {
                ...newResults[questionIndex],
                userAnswer: userAnswer || "Không trả lời",
                isCorrect: isCorrect
            };
            return newResults;
        });

        if (isCorrect) {
            setCorrectAnswers(prev => prev + 1);
        }
    }, []);

    const handleQuestionNavigation = useCallback((index) => {
        setCurrentQuestionIndex(index);
    }, []);

    const handleSubmitQuiz = useCallback(() => {
        if (timer) {
            clearInterval(timer);
        }
        setIsCompleted(true);
        setShowResult(true);
    }, [timer]);

    const handleShowHistory = useCallback(() => {
        setShowHistory(true);
    }, []);

    const handleCloseHistory = useCallback(() => {
        setShowHistory(false);
    }, []);

    const handleRestart = useCallback(() => {
        setTimeRemaining(selectedDuration);
        setCorrectAnswers(0);
        setCurrentQuestionIndex(0);
        setIsCompleted(false);
        setShowHistory(false);
        setShowResult(false);
        setHasStarted(false);

        const resetResults = questions.map(question => ({
            question: question.question,
            userAnswer: "Chưa trả lời",
            correctAnswer: question.correctAnswer,
            isCorrect: false,
            explanation: question.explanation,
            questionType: question.type
        }));
        setQuestionResults(resetResults);
    }, [questions, selectedDuration]);

    const speakText = useCallback((text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Trình duyệt của bạn không hỗ trợ Speech Synthesis.');
        }
    }, []);

    if (loading) {
        return (
            <div className="exercise-container">
                <div className="exercise-loading">
                    <p>Đang tải bài tập...</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="exercise-container">
                <div className="exercise-no-questions">
                    <p>Không có câu hỏi nào trong bài tập này.</p>
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
                        onClick={() => {
                            setTimeRemaining(selectedDuration);
                            setHasStarted(true);
                        }}
                    >
                        Bắt đầu
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
                            <GrammarExerciseResultScreen
                                correctAnswers={correctAnswers}
                                totalQuestions={questions.length}
                                onRestart={handleRestart}
                                onExit={() => window.location.href = '/grammar-exercise'}
                            />
                        ) : (
                            <GrammarExerciseCarousel
                                questions={questions}
                                currentQuestionIndex={currentQuestionIndex}
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
                    <GrammarExerciseSidebar
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
                    />
                </div>
            </div>

            <GrammarExerciseHistory
                show={showHistory}
                onClose={handleCloseHistory}
                questionResults={questionResults}
            />
        </div>
    );
};

export default GrammarExerciseDetail;
