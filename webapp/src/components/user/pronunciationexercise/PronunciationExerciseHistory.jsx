import React from 'react';
import { useTranslation } from "react-i18next";

const PronunciationExerciseHistory = ({ show, onClose, questionResults }) => {
    const { t } = useTranslation();
    if (!show) return null;

    const renderResult = (result, index) => {
        if (result.questionType == "pronunciation") {
            const accuracy = Number(result.accuracy || 0);
            let statusText = "";
            let color = "";

            if (accuracy >= 80) {
                statusText = t("pronunciationExercisePage.history.pronunciationGood");
                color = "green";
            } else if (accuracy >= 50) {
                statusText = t("pronunciationExercisePage.history.pronunciationAverage");
                color = "orange";
            } else {
                statusText = t("pronunciationExercisePage.history.pronunciationPoor");
                color = "red";
            }

            return (
                <div key={index} className="exercise-history-item">
                    <h6><strong>{t("pronunciationExercisePage.history.question", { number: index + 1 })}: {result.question}</strong></h6>
                    <p>
                        <strong>{t("pronunciationExercisePage.history.yourPronunciation")}:</strong> {accuracy.toFixed(2)}%
                    </p>
                    <p>
                        <strong>{t("pronunciationExercisePage.history.pronunciationAnswer")}:</strong> {result.correctAnswer}
                    </p>
                    <p>
                        <strong>{t("pronunciationExercisePage.history.result")}:</strong>{" "}
                        <span style={{ color, fontWeight: "bold" }}>{statusText}</span>
                    </p>
                    {index < questionResults.length - 1 && <hr />}
                </div>
            );
        }
        return (
            <div key={index} className="exercise-history-item">
                <h6><strong>{t("pronunciationExercisePage.history.question", { number: index + 1 })}: {result.question}</strong></h6>
                <p>
                    <strong>{t("pronunciationExercisePage.history.yourAnswer")}:</strong> {result.userAnswer}
                </p>
                <p>
                    <strong>{t("pronunciationExercisePage.history.correctAnswer")}:</strong> {result.correctAnswer}
                </p>
                <p>
                    <strong>{t("pronunciationExercisePage.history.result")}:</strong>{" "}
                    {result.isCorrect ? (
                        <span style={{ color: "green", fontWeight: "bold" }}>{t("pronunciationExercisePage.history.correct")}</span>
                    ) : (
                        <span style={{ color: "red", fontWeight: "bold" }}>{t("pronunciationExercisePage.history.incorrect")}</span>
                    )}
                </p>
                <p>
                    <strong>{t("pronunciationExercisePage.history.explanation")}:</strong> {result.explanation}
                </p>
                {index < questionResults.length - 1 && <hr />}
            </div>
        );
    };

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div
                className="custom-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="custom-modal-header">
                    <h5>{t("pronunciationExercisePage.history.title")}</h5>
                    <button className="close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="custom-modal-body">
                    <div id="exercise-historyContent">
                        {questionResults.length == 0 ? (
                            <p>{t("pronunciationExercisePage.history.empty")}</p>
                        ) : (
                            questionResults.map(renderResult)
                        )}
                    </div>
                </div>

                <div className="custom-modal-footer">
                    <button className="footer-btn" onClick={onClose}>
                        {t("pronunciationExercisePage.common.close")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PronunciationExerciseHistory;
