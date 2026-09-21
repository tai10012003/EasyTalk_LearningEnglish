import React from "react";
import { useTranslation } from "react-i18next";

function StoryComplete({ quizResults, onComplete }) {
    const { t } = useTranslation();
    const totalQuestions = quizResults.reduce((sum, q) => sum + q.total, 0);
    const totalCorrect = quizResults.reduce((sum, q) => sum + q.correct, 0);
    const totalUnanswered = quizResults.reduce((sum, q) => sum + q.unanswered, 0);
    const totalIncorrect = totalQuestions - totalCorrect - totalUnanswered;
    const percentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return (
        <div className="story-complete text-center p-5">
            <h2>{t("storyPage.complete.title")}</h2>
            <p>{t("storyPage.complete.description")}</p>
            {totalQuestions > 0 && (
                <div className="quiz-summary mt-4">
                    <h5>{t("storyPage.complete.summaryTitle")}</h5>
                    <p>{t("storyPage.complete.totalQuestions", { count: totalQuestions })}</p>
                    <p>{t("storyPage.complete.correct", { count: totalCorrect })}</p>
                    <p>{t("storyPage.complete.incorrect", { count: totalIncorrect })}</p>
                    <p>{t("storyPage.complete.unanswered", { count: totalUnanswered })}</p>
                    <p>{t("storyPage.complete.accuracy", { percent: percentage })}</p>
                </div>
            )}
            <button className="btn_1 mt-4" onClick={onComplete}>
                <i className="fas fa-unlock-alt me-2"></i>{t("storyPage.complete.unlockNext")}
            </button>
        </div>
    );
}

export default StoryComplete;
