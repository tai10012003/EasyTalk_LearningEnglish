import React, { useCallback } from 'react';
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

const GrammarExerciseSidebar = ({
        timeRemaining,
        formatTime,
        questions,
        questionResults,
        currentQuestionIndex,
        isCompleted,
        onSubmitQuiz,
        onQuestionNavigation,
        onShowHistory,
        selectedDuration,
        answeredCount
    }) => {
        const { t } = useTranslation();
        const handleSubmitClick = useCallback(() => {
            Swal.fire({
                title: t("grammarExercisePage.sidebar.confirmTitle"),
                text: t("grammarExercisePage.sidebar.confirmText"),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: t("grammarExercisePage.sidebar.confirm"),
                cancelButtonText: t("grammarExercisePage.sidebar.cancel")
            }).then((result) => {
                if (result.isConfirmed) {
                    onSubmitQuiz();
                }
            });
        }, [onSubmitQuiz, t]);

        const getCompletedTime = () => {
            const timeTaken = selectedDuration - timeRemaining;
            const minutes = Math.floor(timeTaken / 60);
            const seconds = timeTaken % 60;
            return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
        };

        const getQuestionButtonColor = (index) => {
        const result = questionResults[index];
        if (!result || result.userAnswer == t("grammarExercisePage.detail.unanswered")) {
            return {};
        }

        if (result.isCorrect) {
            return { backgroundColor: "#28a745", color: "white", border: "1px solid #28a745" };
        } else {
            return { backgroundColor: "#dc3545", color: "white", border: "1px solid #dc3545" };
        }
    };

    const allQuestionsAnswered = answeredCount === questions.length;

    return (
        <div className="exercise-sidebar">
            {!isCompleted ? (
                <>
                    <div className="exercise-time-remaining text-center">
                        <span id="exercise-timeLabel">{t("grammarExercisePage.sidebar.timeRemaining")} </span>
                        <span id="exercise-time">{formatTime(timeRemaining)}</span>
                    </div>
                    {allQuestionsAnswered && (
                        <button
                            id="exercise-submitQuizBtn"
                            className="btn_1 mb-4"
                            style={{ width: '100%' }}
                            onClick={handleSubmitClick}
                        >
                            <i className="fas fa-paper-plane"></i> {t("grammarExercisePage.sidebar.submit")}
                        </button>
                    )}
                    {!allQuestionsAnswered && (
                        <div className="text-center mb-4">
                            {t("grammarExercisePage.sidebar.answered", { answered: answeredCount, total: questions.length })}
                        </div>
                    )}
                    <h5 id="exercise-questionListTitle">{t("grammarExercisePage.sidebar.questionList")}</h5>
                    <div className="exercise-question-list mt-3" id="exercise-question-list">
                        {questions.map((_, index) => (
                            <button
                                key={index}
                                className={`exercise-question-number ${
                                    index == currentQuestionIndex ? 'active' : ''
                                }`}
                                id={`exercise-question-btn-${index}`}
                                onClick={() => onQuestionNavigation(index)}
                                style={getQuestionButtonColor(index)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <div id="exercise-completed-info" className="text-center">
                    <h4>{t("grammarExercisePage.sidebar.completedTime")} <span id="exercise-completedTime">{getCompletedTime()}</span></h4>
                    <button
                        className="btn btn-secondary mt-3"
                        id="exercise-viewHistoryBtn"
                        onClick={onShowHistory}
                    >
                        {t("grammarExercisePage.sidebar.viewHistory")}
                    </button>
                </div>
            )}
        </div>
    );
};

export default GrammarExerciseSidebar;
