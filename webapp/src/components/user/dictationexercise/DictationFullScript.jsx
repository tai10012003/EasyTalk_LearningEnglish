import React from "react";
import { useTranslation } from "react-i18next";

function DictationFullScript({
    fullScript,
    toggleScript,
    showScript,
    playFullScript,
    fullScriptSpeed,
    updateFullScriptSpeed,
    }) {
    const { t } = useTranslation();
    return (
        <div className="full-script-container">
            <h3>{t("dictationExercisePage.fullScript.title")}</h3>
            <div>
                <button onClick={playFullScript} id="playFullScriptButton">
                    <i className="fas fa-volume-up"></i>
                </button>
                <label
                    htmlFor="fullScriptSpeedControl"
                    style={{ fontWeight: "bold", fontSize: "17px", margin: "0 10px" }}
                    >
                    {t("dictationExercisePage.controls.audioSpeed")}
                </label>
                <input
                    type="range"
                    id="fullScriptSpeedControl"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={fullScriptSpeed}
                    onChange={updateFullScriptSpeed}
                />
                <span id="fullScriptSpeedDisplay">{fullScriptSpeed}x</span>
            </div>

            <button onClick={toggleScript} id="toggleScriptButton">
                {showScript ? t("dictationExercisePage.fullScript.hideScript") : t("dictationExercisePage.fullScript.showScript")}
            </button>
            {showScript && (
                <div id="fullScriptText" dangerouslySetInnerHTML={{ __html: fullScript }} />
            )}
        </div>
    );
}

export default DictationFullScript;
