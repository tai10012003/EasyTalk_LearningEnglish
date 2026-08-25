import React from 'react';

const VocabularyExerciseHistoryReviewCarousel = ({
    questionResults,
    currentQuestionIndex,
    onQuestionNavigation
}) => {
    const currentQuestion = questionResults[currentQuestionIndex];

    const getQuestionTitle = () => {
        switch (currentQuestion?.type) {
            case 'multiple-choice': return 'Chọn đáp án đúng:';
            case 'fill-in-the-blank': return 'Điền vào chỗ trống:';
            default: return 'Câu hỏi:';
        }
    };

    const renderMultipleChoice = () => {
        const options = currentQuestion?.options || [];
        return (
            <div className="exercise-question-form">
                {options.map((option, optIndex) => {
                    const isUserAnswer = currentQuestion.userAnswer === option;
                    const isCorrectAnswer = currentQuestion.correctAnswer === option;
                    return (
                        <div key={optIndex} className="exercise-form-check">
                            <input
                                className="exercise-form-check-input"
                                type="radio"
                                name={`vocabulary-history-answer-${currentQuestionIndex}`}
                                value={option}
                                id={`vocabulary-history-option-${optIndex}-${currentQuestionIndex}`}
                                checked={isUserAnswer}
                                disabled
                                readOnly
                            />
                            <label
                                className={`exercise-form-check-label ${
                                    isUserAnswer && !currentQuestion.isCorrect ? 'exercise-incorrect-answer' : ''
                                } ${
                                    isCorrectAnswer ? 'exercise-correct-answer' : ''
                                }`}
                                htmlFor={`vocabulary-history-option-${optIndex}-${currentQuestionIndex}`}
                            >
                                {option}
                            </label>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderTextAnswer = () => (
        <div className="exercise-question-form">
            <textarea
                className={`form-control exercise-question-input ${
                    currentQuestion?.isCorrect ? 'exercise-correct-answer' : 'exercise-incorrect-answer'
                }`}
                rows="4"
                value={currentQuestion?.userAnswer || "Chưa trả lời"}
                disabled
                readOnly
            />
        </div>
    );

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questionResults.length - 1) {
            onQuestionNavigation(currentQuestionIndex + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            onQuestionNavigation(currentQuestionIndex - 1);
        }
    };

    if (!currentQuestion) return null;

    return (
        <div className="exercise-carousel-container">
            <div className="exercise-question-card">
                <h4 className="exercise-question-title">{getQuestionTitle()}</h4>
                <h5 className="exercise-question-text">
                    {currentQuestionIndex + 1}. {currentQuestion.question}
                </h5>
                <div className="exercise-question-form-container mt-4">
                    {currentQuestion.type === "multiple-choice" ? renderMultipleChoice() : renderTextAnswer()}
                    <div className="exercise-explanation mt-4">
                        {currentQuestion.isCorrect ? (
                            <p>
                                <strong>Bạn đã trả lời đúng!</strong><br />
                                Giải thích: {currentQuestion.explanation}
                            </p>
                        ) : (
                            <p>
                                <strong>Bạn đã trả lời sai.</strong> Đáp án đúng là: <strong>{currentQuestion.correctAnswer}</strong><br />
                                Giải thích: {currentQuestion.explanation}
                            </p>
                        )}
                    </div>
                </div>
                <hr />
                <div className="d-flex justify-content-between mt-3">
                    {currentQuestionIndex > 0 && (
                        <button className="btn_2" style={{ marginRight: '20px', marginTop: '20px' }} type="button" onClick={handlePrevQuestion}>
                            <i className="fas fa-arrow-left"></i> Quay lại
                        </button>
                    )}
                    {currentQuestionIndex < questionResults.length - 1 && (
                        <button className="btn_2" type="button" onClick={handleNextQuestion} style={{ marginLeft: currentQuestionIndex === 0 ? 'auto' : '0' }}>
                            <i className="fas fa-arrow-right"></i> Tiếp theo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VocabularyExerciseHistoryReviewCarousel;
