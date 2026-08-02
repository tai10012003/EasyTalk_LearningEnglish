import React from "react";
import { useTranslation } from "react-i18next";

function PronunciationComplete({onComplete}) {
    const { t } = useTranslation();
    return (
        <div className="story-complete text-center p-5">
            <h2>{t("pronunciationPage.complete.title")}</h2>
            <p>{t("pronunciationPage.complete.description")}</p>
            <button className="btn_1 mt-4" onClick={onComplete}>
                <i className="fas fa-unlock-alt me-2"></i>{t("pronunciationPage.complete.unlockNext")}
            </button>
        </div>
    );
}

export default PronunciationComplete;
