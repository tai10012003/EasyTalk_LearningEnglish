import React from 'react';
import { useTranslation } from "react-i18next";

const GrammarExerciseHistoryReviewSidebar = ({
    questionResults,
    currentQuestionIndex,
    onQuestionNavigation,
    summary
}) => {
    const { t } = useTranslation();

    const getQuestionButtonColor = (index) => {
        const result = questionResults[index];
        if (!result || !result.userAnswer) {
            return {};
        }
        if (result.isCorrect) {
            return { backgroundColor: "#28a745", color: "white", border: "1px solid #28a745" };
        }
        return { backgroundColor: "#dc3545", color: "white", border: "1px solid #dc3545" };
    };

    return (
        <div className="exercise-sidebar">
            <div className="text-center mb-4">
                <h4>{Math.round(summary.score || 0)}%</h4>
                <p className="mb-1">
                    {summary.correctCount}/{summary.totalQuestions} {t("grammarExercisePage.history.correct").toLowerCase()}
                </p>
                <p className={`grammar-history-review-status ${summary.status === "completed" ? "completed" : "in-progress"}`}>
                    {summary.status === "completed" ? t("grammarExercisePage.history.completed", { defaultValue: "Đã hoàn thành" }) : t("grammarExercisePage.history.inProgress", { defaultValue: "Chưa hoàn thành" })}
                </p>
            </div>
            <h5 id="exercise-questionListTitle">{t("grammarExercisePage.sidebar.questionList")}</h5>
            <div className="exercise-question-list mt-3" id="exercise-question-list">
                {questionResults.map((_, index) => (
                    <button
                        key={index}
                        className={`exercise-question-number ${
                            index === currentQuestionIndex ? 'active' : ''
                        }`}
                        id={`history-question-btn-${index}`}
                        onClick={() => onQuestionNavigation(index)}
                        style={getQuestionButtonColor(index)}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default GrammarExerciseHistoryReviewSidebar;
