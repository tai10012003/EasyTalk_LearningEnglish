import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { StageService } from "../../services/StageService";
import StageCarousel from "../../components/user/stage/StageCarousel";
import StageResultScreen from "../../components/user/stage/StageResultScreen";

const Stage = () => {
    const { id } = useParams();
    const [questions, setQuestions] = useState([]);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [questionResults, setQuestionResults] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [stageTitle, setStageTitle] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStageData = async () => {
            try {
                setLoading(true);
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
                    console.error('Không tìm thấy câu hỏi');
                }
            } catch (error) {
                console.error('Error fetching stage:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchStageData();
    }, [id]);

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

        if (isCorrect) setCorrectAnswers(prev => prev + 1);
    }, []);

    const handleQuestionNavigation = useCallback((index) => {
        setCurrentQuestionIndex(index);
    }, []);

    const handleSubmitStage = useCallback(async () => {
        setIsCompleted(true);
        setShowResult(true);
        try {
            await StageService.completeStage(id);
        } catch (err) {
            console.error("Error completing stage:", err);
        }
    }, [id]);

    const handleRestart = useCallback(() => {
        setCorrectAnswers(0);
        setCurrentQuestionIndex(0);
        setIsCompleted(false);
        setShowResult(false);

        const resetResults = questions.map(q => ({
            question: q.question,
            userAnswer: "Chưa trả lời",
            correctAnswer: q.correctAnswer,
            isCorrect: false,
            explanation: q.explanation,
            questionType: q.type
        }));
        setQuestionResults(resetResults);
    }, [questions]);

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
                    <p>Đang tải bài học...</p>
                </div>
            </div>
        );
    }

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
                    <h3 className="text-center mb-4">{stageTitle}</h3>
                    <div className="exercise-content-container">
                        {showResult ? (
                            <StageResultScreen
                                correctAnswers={correctAnswers}
                                totalQuestions={questions.length}
                                onRestart={handleRestart}
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
        </div>
    );
};

export default Stage;