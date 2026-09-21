import React from 'react';
import iconhappy from "@/assets/images/iconhappy.png";
import iconsad from "@/assets/images/iconsad.png";
import { useTranslation } from "react-i18next";

const GrammarExerciseResultScreen = ({ correctAnswers, totalQuestions, onComplete }) => {
    const { t } = useTranslation();
    const incorrectAnswers = totalQuestions - correctAnswers;
    const percentageCorrect = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const iconSrc = percentageCorrect >= 50 ? iconhappy : iconsad;
    return (
        <div className="exercise-result-screen text-center">
            <h4 className="text-center">{t("grammarExercisePage.result.title")}</h4>
            <div className="row mt-4">
                <div className="col-md-7 exercise-result-content">
                    <p>
                        {t("grammarExercisePage.result.totalQuestions")}: <span className="exercise-result-number">{totalQuestions}</span>
                    </p>
                    <p>
                        {t("grammarExercisePage.result.correctAnswers")}: <span className="exercise-result-number correct">{correctAnswers}</span>
                    </p>
                    <p>
                        {t("grammarExercisePage.result.incorrectAnswers")}: <span className="exercise-result-number incorrect">{incorrectAnswers}</span>
                    </p>
                    <p>
                        {t("grammarExercisePage.result.accuracy")}: <span className="exercise-result-percentage">{percentageCorrect.toFixed(2)}%</span>
                    </p>
                </div>
                <div className="col-md-5 text-center exercise-result-icon">
                    <img src={iconSrc} alt={t("grammarExercisePage.result.iconAlt")} />
                </div>
            </div>
            <div className="d-flex flex-column align-items-center mt-4">
                <button className="btn_1 mt-4" onClick={onComplete}>
                    <i className="fas fa-unlock-alt me-2"></i>{t("grammarExercisePage.result.unlockNext")}
                </button>
            </div>
        </div>
    );
};

export default GrammarExerciseResultScreen;
