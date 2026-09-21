import React from 'react';
import { useTranslation } from "react-i18next";

const VocabularyExerciseHistoryReviewSidebar = ({
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
                    {t("vocabularyExercisePage.attemptHistory.correctCount", { correct: summary.correctCount, total: summary.totalQuestions })}
                </p>
                <p className={`exercise-history-review-status ${summary.status === "completed" ? "completed" : "in-progress"}`}>
                    {summary.status === "completed" ? t("vocabularyExercisePage.attemptHistory.completed") : t("vocabularyExercisePage.attemptHistory.inProgress")}
                </p>
            </div>
            <h5 id="exercise-questionListTitle">{t("vocabularyExercisePage.sidebar.questionList")}</h5>
            <div className="exercise-question-list mt-3" id="exercise-question-list">
                {questionResults.map((_, index) => (
                    <button
                        key={index}
                        className={`exercise-question-number ${
                            index === currentQuestionIndex ? 'active' : ''
                        }`}
                        id={`vocabulary-history-question-btn-${index}`}
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

export default VocabularyExerciseHistoryReviewSidebar;
