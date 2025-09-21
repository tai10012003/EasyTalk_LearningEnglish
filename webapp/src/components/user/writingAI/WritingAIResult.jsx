import React from "react";

function highlightText(text) {
    if (!text) return "";
    text = text.replace(/Điểm tổng quan:.*$/gi, "");
    let highlighted = text
        .replace(/(Lỗi:.*?\.)(?=\s|$)/gi, '<span class="writingai-error">$1</span>')
        .replace(/(Sửa:.*?\.)(?=\s|$)/gi, '<span class="writingai-suggestion">$1</span>');
    return highlighted;
}

function WritingAIResult({ analysisResult }) {
    if (!analysisResult) return null;

    return (
        <div className="writingai-result mt-4">
            <h5>Chấm điểm bài viết từ AI:</h5>
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