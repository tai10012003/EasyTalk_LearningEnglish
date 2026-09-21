import React, { useCallback } from 'react';
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

const PronunciationExerciseSidebar = ({
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
        isSubmitting = false
    }) => {
        const { t } = useTranslation();
        const handleSubmitClick = useCallback(() => {
            Swal.fire({
                title: t("pronunciationExercisePage.sidebar.confirmTitle"),
                text: t("pronunciationExercisePage.sidebar.confirmText"),
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: t("pronunciationExercisePage.sidebar.confirm"),
                cancelButtonText: t("pronunciationExercisePage.sidebar.cancel")
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
        if (!result || result.userAnswer == t("pronunciationExercisePage.detail.unanswered")) {
            return {};
        }

        if (result.isCorrect) {
            return { backgroundColor: "#28a745", color: "white", border: "1px solid #28a745" };
        } else {
            return { backgroundColor: "#dc3545", color: "white", border: "1px solid #dc3545" };
        }
    };

    return (
        <div className="exercise-sidebar">
            {!isCompleted ? (
                <>
                    <div className="exercise-time-remaining text-center">
                        <span id="exercise-timeLabel">{t("pronunciationExercisePage.sidebar.timeRemaining")} </span>
                        <span id="exercise-time">{formatTime(timeRemaining)}</span>
                    </div>
                    
                    <button
                        id="exercise-submitQuizBtn"
                        className="btn_1 mb-4"
                        style ={{ width: '100%' }}
                        onClick={handleSubmitClick}
                        disabled={isSubmitting}
                    >
                        <i className="fas fa-paper-plane"></i> {isSubmitting ? t("pronunciationExercisePage.sidebar.submitting") : t("pronunciationExercisePage.sidebar.submit")}
                    </button>
                    
                    <h5 id="exercise-questionListTitle">{t("pronunciationExercisePage.sidebar.questionList")}</h5>
                    
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
                    <h4>{t("pronunciationExercisePage.sidebar.completedTime")} <span id="exercise-completedTime">{getCompletedTime()}</span></h4>
                    <button
                        className="btn btn-secondary mt-3"
                        id="exercise-viewHistoryBtn"
                        onClick={onShowHistory}
                    >
                        {t("pronunciationExercisePage.sidebar.viewHistory")}
                    </button>
                </div>
            )}
        </div>
    );
};

export default PronunciationExerciseSidebar;
