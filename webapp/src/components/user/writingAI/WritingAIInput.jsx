import React from "react";
import { useTranslation } from "react-i18next";

function WritingAIInput({ topic, userText, setUserText, onSubmit, onReset, disabled, analysisResult }) {
    const { t } = useTranslation();

    return (
        <div className="writingai-input-area mb-3">
            <div className="writingai-topic mb-2">
                <strong>{t("writingAIPage.input.topicLabel")} </strong>
                <p>{topic}</p>
                {!analysisResult && (
                     <button className="btn btn-sm btn-secondary" onClick={onReset} disabled={disabled}>
                        {t("writingAIPage.input.changeTopic")}
                    </button>
                )}
            </div>

            <textarea
                className="writingai-textarea form-control mb-2"
                rows={10}
                placeholder={t("writingAIPage.input.placeholder")}
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                disabled={disabled}
            ></textarea>

            {!analysisResult && (
                <button
                    className="btn_1"
                    onClick={onSubmit}
                    disabled={disabled}
                >
                    {disabled ? t("writingAIPage.input.submitting") : t("writingAIPage.input.submit")}
                </button>
            )}

            {analysisResult && (
                <button
                    className="writingai-continue-btn"
                    onClick={onReset}
                    disabled={disabled}
                >
                    {t("writingAIPage.input.continue")}
                </button>
            )}
        </div>
    );
}

export default WritingAIInput;
