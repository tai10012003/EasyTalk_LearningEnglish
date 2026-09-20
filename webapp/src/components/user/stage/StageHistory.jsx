import React from 'react';
import { useTranslation } from "react-i18next";

const StageHistory = ({ show, onClose, questionResults }) => {
    const { t } = useTranslation();

    if (!show) return null;

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div
                className="custom-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="custom-modal-header">
                    <h5>{t("journeyPage.stageHistory.title")}</h5>
                    <button className="close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>
                
                <div className="custom-modal-body">
                    <div id="exercise-historyContent">
                        {questionResults.length == 0 ? (
                            <p>{t("journeyPage.stageHistory.empty")}</p>
                        ) : (
                            questionResults.map((result, index) => (
                                <div key={index} className="exercise-history-item">
                                    <h6><strong>{t("journeyPage.stageHistory.question", { number: index + 1 })} {result.question}</strong></h6>
                                    <p>
                                        <strong>{t("journeyPage.stageHistory.yourAnswer")}</strong> {result.userAnswer}
                                    </p>
                                    <p>
                                        <strong>{t("journeyPage.stageHistory.correctAnswer")}</strong> {result.correctAnswer}
                                    </p>
                                    <p>
                                        <strong>{t("journeyPage.stageHistory.result")}</strong>{' '}
                                        {result.isCorrect ? (
                                            <span style={{ color: 'green', fontWeight: 'bold' }}>✓ {t("journeyPage.stageHistory.correct")}</span>
                                        ) : (
                                            <span style={{ color: 'red', fontWeight: 'bold' }}>✗ {t("journeyPage.stageHistory.incorrect")}</span>
                                        )}
                                    </p>
                                    <p>
                                        <strong>{t("journeyPage.stageHistory.explanation")}</strong> {result.explanation}
                                    </p>
                                    {index < questionResults.length - 1 && <hr />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
                
                <div className="custom-modal-footer">
                    <button className="footer-btn" onClick={onClose}>
                        {t("journeyPage.stageHistory.close")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StageHistory;
