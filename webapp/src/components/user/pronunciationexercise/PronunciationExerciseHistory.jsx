import React from 'react';

const PronunciationExerciseHistory = ({ show, onClose, questionResults }) => {
    if (!show) return null;

    const renderResult = (result, index) => {
        if (result.questionType == "pronunciation") {
            const accuracy = Number(result.accuracy || 0);
            let statusText = "";
            let color = "";

            if (accuracy >= 80) {
                statusText = "Phát âm tốt";
                color = "green";
            } else if (accuracy >= 50) {
                statusText = "Phát âm trung bình";
                color = "orange";
            } else {
                statusText = "Phát âm tệ";
                color = "red";
            }

            return (
                <div key={index} className="exercise-history-item">
                    <h6><strong>Câu {index + 1}: {result.question}</strong></h6>
                    <p>
                        <strong>Phát âm của bạn:</strong> {accuracy.toFixed(2)}%
                    </p>
                    <p>
                        <strong>Đáp án phát âm:</strong> {result.correctAnswer}
                    </p>
                    <p>
                        <strong>Kết quả:</strong>{" "}
                        <span style={{ color, fontWeight: "bold" }}>{statusText}</span>
                    </p>
                    {index < questionResults.length - 1 && <hr />}
                </div>
            );
        }
        return (
            <div key={index} className="exercise-history-item">
                <h6><strong>Câu {index + 1}: {result.question}</strong></h6>
                <p>
                    <strong>Đáp án của bạn:</strong> {result.userAnswer}
                </p>
                <p>
                    <strong>Đáp án đúng:</strong> {result.correctAnswer}
                </p>
                <p>
                    <strong>Kết quả:</strong>{" "}
                    {result.isCorrect ? (
                        <span style={{ color: "green", fontWeight: "bold" }}>✓ Đúng</span>
                    ) : (
                        <span style={{ color: "red", fontWeight: "bold" }}>✗ Sai</span>
                    )}
                </p>
                <p>
                    <strong>Giải thích:</strong> {result.explanation}
                </p>
                {index < questionResults.length - 1 && <hr />}
            </div>
        );
    };

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div
                className="custom-modal"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="custom-modal-header">
                    <h5>LỊCH SỬ LÀM BÀI LUYỆN TẬP PHÁT ÂM</h5>
                    <button className="close-btn" onClick={onClose}>
                        &times;
                    </button>
                </div>

                <div className="custom-modal-body">
                    <div id="exercise-historyContent">
                        {questionResults.length == 0 ? (
                            <p>Không có dữ liệu lịch sử.</p>
                        ) : (
                            questionResults.map(renderResult)
                        )}
                    </div>
                </div>

                <div className="custom-modal-footer">
                    <button className="footer-btn" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PronunciationExerciseHistory;