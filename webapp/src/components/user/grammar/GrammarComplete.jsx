import React from "react";
import { useTranslation } from "react-i18next";

function GrammarComplete({ onComplete }) {
    const { t } = useTranslation();

    return (
        <div className="story-complete text-center p-5">
            <h2>{t("grammarPage.complete.title")}</h2>
            <p>{t("grammarPage.complete.description")}</p>
            <button className="btn_1 mt-4" onClick={onComplete}>
                <i className="fas fa-unlock-alt me-2"></i>{t("grammarPage.complete.unlockNext")}
            </button>
        </div>
    );
}

export default GrammarComplete;
