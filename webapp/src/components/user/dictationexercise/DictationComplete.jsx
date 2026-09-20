import React from "react";
import { useTranslation } from "react-i18next";

function DictationComplete({ onComplete }) {
    const { t } = useTranslation();
    return (
        <div className="dictation-complete-card text-center p-5">
            <h4>{t("dictationExercisePage.complete.title")}</h4>
            <p>{t("dictationExercisePage.complete.description")}</p>
            <div className="d-flex flex-column align-items-center mt-4">
                <button className="btn_1" onClick={onComplete}>
                    <i className="fas fa-unlock-alt me-2"></i>{t("dictationExercisePage.complete.unlockNext")}
                </button>
            </div>
        </div>
    );
}

export default DictationComplete;
