import React, { useState, useCallback } from 'react';

const StageCarousel = ({
    questions,
    currentQuestionIndex,
    onAnswerSubmit,
    onQuestionNavigation,
    onSpeakText,
    questionResults,
    isCompleted,
    onSubmitStage
}) => {
    const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
    const [userAnswers, setUserAnswers] = useState({});
    const currentQuestion = questions[currentQuestionIndex];

    const handleAnswerChange = useCallback((value) => {
        setUserAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: value
        }));
    }, [currentQuestionIndex]);

    const handleSubmitAnswer = useCallback(() => {
        const userAnswer = userAnswers[currentQuestionIndex];
        if (!userAnswer || userAnswer.trim() == '') {
            alert("Vui lòng chọn/nhập câu trả lời !!");
            return;
        }

        const correctAnswer = currentQuestion.correctAnswer.trim().toLowerCase();
        const normalizedUserAnswer = userAnswer.trim().toLowerCase();
        const isCorrect = normalizedUserAnswer == correctAnswer;

        onAnswerSubmit(currentQuestionIndex, userAnswer, isCorrect);
        setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
    }, [currentQuestionIndex, userAnswers, currentQuestion, onAnswerSubmit]);

    const handleNextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            onQuestionNavigation(currentQuestionIndex + 1);
        }
    }, [currentQuestionIndex, questions.length, onQuestionNavigation]);

    const isQuestionAnswered = answeredQuestions.has(currentQuestionIndex);
    const questionResult = questionResults[currentQuestionIndex];

    const renderMultipleChoice = () => (
        <div className="exercise-question-form">
            {currentQuestion.options
                .filter(option => option.trim() !== "")
                .map((option, optIndex) => (
                    <div key={optIndex} className="exercise-form-check">
                        <input
                            className="exercise-form-check-input"
                            type="radio"
                            name={`exercise-answer-${currentQuestionIndex}`}
                            value={option}
                            id={`exercise-option-${optIndex}-${currentQuestionIndex}`}
                            onChange={() => handleAnswerChange(option)}
                            checked={userAnswers[currentQuestionIndex] == option}
                            disabled={isQuestionAnswered}
                        />
                        <label
                            className={`exercise-form-check-label ${
                                isQuestionAnswered && questionResult.userAnswer == option
                                    ? questionResult.isCorrect 
                                        ? 'exercise-correct-answer' 
                                        : 'exercise-incorrect-answer'
                                    : ''
                            } ${
                                isQuestionAnswered && questionResult.correctAnswer == option
                                    ? 'exercise-correct-answer'
                                    : ''
                            }`}
                            htmlFor={`exercise-option-${optIndex}-${currentQuestionIndex}`}
                        >
                            {option}
                        </label>
                    </div>
                ))}
        </div>
    );

    const renderTextInput = () => (
        <div className="exercise-question-form">
            <textarea
                className={`form-control exercise-question-input ${
                    isQuestionAnswered
                        ? questionResult.isCorrect
                            ? 'exercise-correct-answer'
                            : 'exercise-incorrect-answer'
                        : ''
                }`}
                name="exercise-answer"
                rows="4"
                placeholder="Nhập câu trả lời của bạn"
                value={userAnswers[currentQuestionIndex] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                disabled={isQuestionAnswered}
            />
        </div>
    );

    const getQuestionTitle = () => {
        switch (currentQuestion.type) {
            case 'multiple-choice':
                return 'Chọn đáp án đúng:';
            case 'fill-in-the-blank':
                return 'Điền vào chỗ trống:';
            case 'translation':
                return 'Dịch câu dưới đây:';
            default:
                return 'Câu hỏi:';
        }
    };

    return (
        <div className="exercise-carousel-container">
            <div className="exercise-question-card">
                <h4 className="exercise-question-title">{getQuestionTitle()}</h4>
                <h5 className="exercise-question-text" id={`exercise-ques-${currentQuestionIndex}`}>
                    <button
                        className="exercise-speak-button btn-sm btn-outline mr-2"
                        onClick={() => onSpeakText(currentQuestion.question)}
                        type="button"
                    >
                        🔊
                    </button>
                    {currentQuestionIndex + 1}. {currentQuestion.question}
                </h5>

                <form id={`exercise-question-form-${currentQuestionIndex}`} className="exercise-question-form-container mt-4">
                    {currentQuestion.type == 'multiple-choice' ? renderMultipleChoice() : renderTextInput()}

                    {isQuestionAnswered && (
                        <div className="exercise-explanation mt-4">
                            {questionResult.isCorrect ? (
                                <p>
                                    <strong>Bạn đã trả lời đúng.</strong><br />
                                    Giải thích: {questionResult.explanation}
                                </p>
                            ) : (
                                <p>
                                    <strong>Bạn đã trả lời sai.</strong> Đáp án đúng là: <strong>{questionResult.correctAnswer}</strong><br />
                                    Giải thích: {questionResult.explanation}
                                </p>
                            )}
                        </div>
                    )}

                    {!isQuestionAnswered && !isCompleted && (
                        <button
                            type="button"
                            className="exercise-submit-answer mt-4 mb-4"
                            onClick={handleSubmitAnswer}
                        >
                            Kiểm tra
                        </button>
                    )}
                </form>
                {isQuestionAnswered && !isCompleted && (
                    <div className="d-flex justify-content-end mt-3">
                        {currentQuestionIndex == questions.length - 1 ? (
                            <button
                                className="btn_2 mt-4 mb-4"
                                style ={{ width: '100%' }}
                                type="button"
                                onClick={onSubmitStage}
                            >
                                HOÀN THÀNH
                            </button>
                        ) : (
                            <button
                                className="btn_1 mt-4 mb-4"
                                style ={{ width: '100%' }}
                                type="button"
                                onClick={handleNextQuestion}
                            >
                                Tiếp tục
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StageCarousel;