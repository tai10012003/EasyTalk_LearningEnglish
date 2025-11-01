import React, { useState, useEffect, useCallback } from 'react';
import { useParams, UNSAFE_NavigationContext } from 'react-router-dom';
import { GrammarExerciseService } from "@/services/GrammarExerciseService.jsx";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import GrammarExerciseSidebar from "@/components/user/grammarexercise/GrammarExerciseSidebar.jsx";
import GrammarExerciseCarousel from "@/components/user/grammarexercise/GrammarExerciseCarousel.jsx";
import GrammarExerciseResultScreen from "@/components/user/grammarexercise/GrammarExerciseResultScreen.jsx";
import GrammarExerciseHistory from "@/components/user/grammarexercise/GrammarExerciseHistory.jsx";
import Swal from "sweetalert2";

const GrammarExerciseDetail = () => {
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
    const allowNavigationRef = React.useRef(false);
    const [exerciseCompleted, setExerciseCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasStarted, setHasStarted] = useState(false);
    const [answeredCount, setAnsweredCount] = useState(0);

    useEffect(() => {
        if (!navigator || !hasStarted || exerciseCompleted) return;
        const originalPush = navigator.push;
        const originalReplace = navigator.replace;
        const handleNavigation = async (originalMethod, args) => {
            if (!allowNavigationRef.current && hasStarted && !exerciseCompleted) {
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
        document.title = "Chi tiết luyện tập ngữ pháp - EasyTalk";
        const fetchExerciseData = async () => {
            try {
                setIsLoading(true);
                const data = await GrammarExerciseService.getGrammarExerciseBySlug(slug);
                if (data && data.questions && data.questions.length > 0) {
                    setExerciseId(data._id);
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
        setExerciseCompleted(true);
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
                                onComplete={async () => {
                                    try {
                                        await GrammarExerciseService.completeGrammarExercise(exerciseId);
                                        setExerciseCompleted(true);
                                        Swal.fire({
                                            icon: "success",
                                            title: "Hoàn thành!",
                                            text: "Chúc mừng! Bạn đã hoàn thành bài luyện tập ngữ pháp. Bài luyện tập ngữ pháp tiếp theo đã được mở khóa.",
                                            confirmButtonText: "Quay lại danh sách bài luyện tập ngữ pháp",
                                        }).then(() => {
                                            window.location.href = "/grammar-exercise";
                                        });
                                    } catch (err) {
                                        console.error("Error completing grammar exercise:", err);
                                        Swal.fire({
                                            icon: "error",
                                            title: "Lỗi",
                                            text: "Có lỗi xảy ra khi cập nhật tiến độ."
                                        });
                                    }
                                }} 
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
                                onAnsweredQuestionsChange={setAnsweredCount}
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
                        answeredCount={answeredCount}
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