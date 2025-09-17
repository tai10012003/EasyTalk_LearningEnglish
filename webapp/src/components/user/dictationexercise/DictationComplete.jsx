import React from "react";

function DictationComplete({retryExercise, goBackToList }) {
    return (
        <div className="dictation-complete-card text-center p-5">
            <h4>🎉 Bạn đã hoàn thành bài luyện nghe chép chính tả !</h4>
            <p>Chúc mừng bạn, hãy tiếp tục luyện tập nhé!</p>
            <button className="btn_1 mt-4" onClick={retryExercise} style={{ marginRight: '20px' }}>
                {/* <i className="fas fa-unlock-alt me-2"></i> */}
                Làm lại
            </button>
            <button className="btn_1 mt-4" onClick={goBackToList}>
                {/* <i className="fas fa-unlock-alt me-2"></i> */}
                Quay lại
            </button>
        </div>
    );
}

export default DictationComplete;