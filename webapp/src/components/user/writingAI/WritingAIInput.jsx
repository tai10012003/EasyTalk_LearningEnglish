import React, { useState } from "react";

function WritingAIInput({ topic, userText, setUserText, onSubmit, onReset, disabled, analysisResult }) {
    return (
        <div className="writingai-input-area mb-3">
            <div className="writingai-topic mb-2">
                <strong>Đề bài dành cho bạn: </strong>
                <p>{topic}</p>
                {!analysisResult && (
                     <button className="btn btn-sm btn-secondary" onClick={onReset} disabled={disabled}>
                        Đổi đề bài khác
                    </button>
                )}
            </div>

            <textarea
                className="writingai-textarea form-control mb-2"
                rows={10}
                placeholder="Viết bài của bạn tại đây..."
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
                    {disabled ? "Đang gửi..." : "Nộp bài"}
                </button>
            )}

            {analysisResult && (
                <button
                    className="writingai-continue-btn"
                    onClick={onReset}
                    disabled={disabled}
                >
                    Tiếp tục làm bài
                </button>
            )}
        </div>
    );
}

export default WritingAIInput;