import React from 'react';
import { useTranslation } from "react-i18next";

const VocabularyExerciseHistory = ({ show, onClose, questionResults }) => {
    const { t } = useTranslation();
    if (!show) return null;

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div
                className="custom-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="custom-modal-header">
                    <h5>{t("vocabularyExercisePage.history.title")}</h5>
                    <button className="close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>
                
                <div className="custom-modal-body">
                    <div id="exercise-historyContent">
                        {questionResults.length == 0 ? (
                            <p>{t("vocabularyExercisePage.history.empty")}</p>
                        ) : (
                            questionResults.map((result, index) => (
                                <div key={index} className="exercise-history-item">
                                    <h6><strong>{t("vocabularyExercisePage.history.question", { number: index + 1 })}: {result.question}</strong></h6>
                                    <p>
                                        <strong>{t("vocabularyExercisePage.history.yourAnswer")}:</strong> {result.userAnswer}
                                    </p>
                                    <p>
                                        <strong>{t("vocabularyExercisePage.history.correctAnswer")}:</strong> {result.correctAnswer}
                                    </p>
                                    <p>
                                        <strong>{t("vocabularyExercisePage.history.result")}:</strong>{' '}
                                        {result.isCorrect ? (
                                            <span style={{ color: 'green', fontWeight: 'bold' }}>{t("vocabularyExercisePage.history.correct")}</span>
                                        ) : (
                                            <span style={{ color: 'red', fontWeight: 'bold' }}>{t("vocabularyExercisePage.history.incorrect")}</span>
                                        )}
                                    </p>
                                    <p>
                                        <strong>{t("vocabularyExercisePage.history.explanation")}:</strong> {result.explanation}
                                    </p>
                                    {index < questionResults.length - 1 && <hr />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                <div className="custom-modal-footer">
                    <button className="footer-btn" onClick={onClose}>
                        {t("vocabularyExercisePage.common.close")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VocabularyExerciseHistory;
