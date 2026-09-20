import React from "react";
import { useTranslation } from "react-i18next";

function highlightText(text) {
    if (!text) return "";
    text = text.replace(/Điểm tổng quan:.*$/gi, "");
    let highlighted = text
        .replace(/(Lỗi:.*?\.)(?=\s|$)/gi, '<span class="writingai-error">$1</span>')
        .replace(/(Sửa:.*?\.)(?=\s|$)/gi, '<span class="writingai-suggestion">$1</span>');
    return highlighted;
}

function WritingAIResult({ analysisResult }) {
    const { t } = useTranslation();

    if (!analysisResult) return null;

    const hasStructuredFeedback = analysisResult.summary || analysisResult.rubric || analysisResult.corrections || analysisResult.rewriteSuggestion;
    if (hasStructuredFeedback) {
        const rubric = analysisResult.rubric || {};
        const rubricItems = [
            ["Task response", rubric.taskResponse],
            ["Coherence", rubric.coherence],
            ["Vocabulary", rubric.vocabulary],
            ["Grammar", rubric.grammar]
        ].filter(([, value]) => value !== null && value !== undefined);

        return (
            <div className="writingai-result mt-4">
                <div className="writingai-structured-header">
                    <div>
                        <h5>{t("writingAIPage.result.title")}</h5>
                        {analysisResult.summary && <p>{analysisResult.summary}</p>}
                    </div>
                    <div className="writingai-score-pill">
                        <strong>{analysisResult.score ?? "?"}</strong>
                        <span>/10</span>
                    </div>
                </div>

                {rubricItems.length > 0 && (
                    <div className="writingai-rubric-grid">
                        {rubricItems.map(([label, value]) => (
                            <div key={label} className="writingai-rubric-item">
                                <span>{label}</span>
                                <strong>{value}/10</strong>
                            </div>
                        ))}
                    </div>
                )}

                {analysisResult.strengths?.length > 0 && (
                    <div className="writingai-feedback-section">
                        <h6>{t("writingAIPage.result.strengths")}</h6>
                        <ul>
                            {analysisResult.strengths.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {analysisResult.corrections?.length > 0 && (
                    <div className="writingai-feedback-section">
                        <h6>{t("writingAIPage.result.corrections")}</h6>
                        {analysisResult.corrections.map((item, index) => (
                            <div key={index} className="writingai-correction-card">
                                <p><strong>{t("writingAIPage.result.original")}:</strong> {item.original}</p>
                                <p><strong>{t("writingAIPage.result.corrected")}:</strong> {item.corrected}</p>
                                {item.explanation && <small>{item.explanation}</small>}
                            </div>
                        ))}
                    </div>
                )}

                {analysisResult.rewriteSuggestion && (
                    <div className="writingai-feedback-section">
                        <h6>{t("writingAIPage.result.rewrite")}</h6>
                        <div className="writingai-rewrite-box">{analysisResult.rewriteSuggestion}</div>
                    </div>
                )}

                {analysisResult.nextActions?.length > 0 && (
                    <div className="writingai-feedback-section">
                        <h6>{t("writingAIPage.result.nextActions")}</h6>
                        <ul>
                            {analysisResult.nextActions.map((action, index) => (
                                <li key={index}>{action.title}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="writingai-result mt-4">
            <h5>{t("writingAIPage.result.legacyTitle")}</h5>
            <div
                className="writingai-feedback"
                dangerouslySetInnerHTML={{ __html: highlightText(analysisResult.suggestions) }}
            />
            {/* <p className="writingai-score">
                <strong>Điểm tổng cộng:</strong> {analysisResult.score}/10
            </p> */}
        </div>
    );
}

export default WritingAIResult;
