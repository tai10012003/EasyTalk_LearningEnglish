import React from 'react';
import { useTranslation } from "react-i18next";

const GrammarExerciseHistoryReviewCarousel = ({
    questionResults,
    currentQuestionIndex,
    onQuestionNavigation
}) => {
    const { t } = useTranslation();
    const currentQuestion = questionResults[currentQuestionIndex];

    const getQuestionTitle = () => {
        switch (currentQuestion?.type) {
            case 'multiple-choice': return t("grammarExercisePage.carousel.questionTypes.multipleChoice");
            case 'fill-in-the-blank': return t("grammarExercisePage.carousel.questionTypes.fillBlank");
            case 'translation': return t("grammarExercisePage.carousel.questionTypes.translation");
            case 'arrange-words': return t("grammarExercisePage.carousel.questionTypes.arrange");
            default: return t("grammarExercisePage.carousel.questionTypes.default");
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
                                name={`history-answer-${currentQuestionIndex}`}
                                value={option}
                                id={`history-option-${optIndex}-${currentQuestionIndex}`}
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
                                htmlFor={`history-option-${optIndex}-${currentQuestionIndex}`}
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
                value={currentQuestion?.userAnswer || t("grammarExercisePage.detail.unanswered")}
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
                                <strong>{t("grammarExercisePage.carousel.correct")}</strong><br />
                                {t("grammarExercisePage.carousel.explanation")}: {currentQuestion.explanation}
                            </p>
                        ) : (
                            <p>
                                <strong>{t("grammarExercisePage.carousel.incorrect")}</strong> {t("grammarExercisePage.carousel.correctAnswer")}: <strong>{currentQuestion.correctAnswer}</strong><br />
                                {t("grammarExercisePage.carousel.explanation")}: {currentQuestion.explanation}
                            </p>
                        )}
                    </div>
                </div>
                <hr />
                <div className="d-flex justify-content-between mt-3">
                    {currentQuestionIndex > 0 && (
                        <button
                            className="btn_2"
                            style={{ marginRight: '20px', marginTop: '20px' }}
                            type="button"
                            onClick={handlePrevQuestion}
                        >
                            <i className="fas fa-arrow-left"></i> {t("grammarExercisePage.carousel.back")}
                        </button>
                    )}
                    {currentQuestionIndex < questionResults.length - 1 && (
                        <button
                            className="btn_2"
                            type="button"
                            onClick={handleNextQuestion}
                            style={{ marginLeft: currentQuestionIndex === 0 ? 'auto' : '0' }}
                        >
                            <i className="fas fa-arrow-right"></i> {t("grammarExercisePage.carousel.next")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrammarExerciseHistoryReviewCarousel;
