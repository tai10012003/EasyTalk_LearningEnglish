import React from 'react';
import iconhappy from "@/assets/images/iconhappy.png";
import iconsad from "@/assets/images/iconsad.png";
import { useTranslation } from "react-i18next";

const StageResultScreen = ({ correctAnswers, totalQuestions, onShowHistory, onExit }) => {
    const { t } = useTranslation();
    const incorrectAnswers = totalQuestions - correctAnswers;
    const percentageCorrect = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const iconSrc = percentageCorrect >= 50 ? iconhappy : iconsad;

    return (
        <div className="exercise-result-screen text-center">
            <h4 className="text-center">{t("journeyPage.stageResult.title")}</h4>
            
            <div className="row mt-4">
                <div className="col-md-7 exercise-result-content">
                    <p>
                        {t("journeyPage.stageResult.totalQuestions")} <span className="exercise-result-number">{totalQuestions}</span>
                    </p>
                    <p>
                        {t("journeyPage.stageResult.correctAnswers")} <span className="exercise-result-number correct">{correctAnswers}</span>
                    </p>
                    <p>
                        {t("journeyPage.stageResult.incorrectAnswers")} <span className="exercise-result-number incorrect">{incorrectAnswers}</span>
                    </p>
                    <p>
                        {t("journeyPage.stageResult.accuracy")} <span className="exercise-result-percentage">{percentageCorrect.toFixed(2)}%</span>
                    </p>
                </div>
                
                <div className="col-md-5 text-center exercise-result-icon">
                    <img src={iconSrc} alt={t("journeyPage.stageResult.iconAlt")} />
                </div>
            </div>
            
            <div className="d-flex flex-column align-items-center mt-4">
                <button
                    className="btn btn-secondary mt-3"
                    id="exercise-viewHistoryBtnStage"
                    onClick={onShowHistory}
                >
                    {t("journeyPage.stageResult.viewHistory")}
                </button>
                <button
                    className="btn btn-secondary exercise-exit-btn"
                    onClick={onExit}
                >
                    {t("journeyPage.stageResult.exit")}
                </button>
            </div>
        </div>
    );
};

export default StageResultScreen;
