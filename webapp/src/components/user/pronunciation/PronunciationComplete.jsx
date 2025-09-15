import React from "react";

function PronunciationComplete({onComplete}) {
    return (
        <div className="story-complete text-center p-5">
            <h2>🎉 Bạn đã hoàn thành bài học phát âm!</h2>
            <p>Chúc mừng bạn, hãy tiếp tục luyện tập nhé!</p>
            <button className="btn_1 mt-4" onClick={onComplete}>
                <i className="fas fa-unlock-alt me-2"></i>Mở khóa bài phát âm tiếp theo
            </button>
        </div>
    );
}

export default PronunciationComplete;