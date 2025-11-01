import React from "react";

function DictationComplete({ onComplete }) {
    return (
        <div className="dictation-complete-card text-center p-5">
            <h4>🎉 Bạn đã hoàn thành bài luyện nghe chép chính tả !</h4>
            <p>Chúc mừng bạn, hãy tiếp tục luyện tập nhé!</p>
            <div className="d-flex flex-column align-items-center mt-4">
                <button className="btn_1" onClick={onComplete}>
                    <i className="fas fa-unlock-alt me-2"></i>Mở khóa bài luyện tập nghe chính tả tiếp theo
                </button>
            </div>
        </div>
    );
}

export default DictationComplete;