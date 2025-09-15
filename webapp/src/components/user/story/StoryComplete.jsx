import React from "react";

function StoryComplete({ quizResults, onComplete }) {
    const totalQuestions = quizResults.reduce((sum, q) => sum + q.total, 0);
    const totalCorrect = quizResults.reduce((sum, q) => sum + q.correct, 0);
    const totalUnanswered = quizResults.reduce((sum, q) => sum + q.unanswered, 0);
    const totalIncorrect = totalQuestions - totalCorrect - totalUnanswered;
    const percentage = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

    return (
        <div className="story-complete text-center p-5">
            <h2>🎉 Bạn đã hoàn thành câu chuyện!</h2>
            <p>Chúc mừng bạn, hãy tiếp tục luyện tập nhé!</p>
            {totalQuestions > 0 && (
                <div className="quiz-summary mt-4">
                    <h5>📊 Thống kê quiz:</h5>
                    <p>Tổng số câu hỏi: {totalQuestions}</p>
                    <p>Số câu đúng: {totalCorrect}</p>
                    <p>Số câu sai: {totalIncorrect}</p>
                    <p>Số câu chưa trả lời: {totalUnanswered}</p>
                    <p>Tỷ lệ chính xác: {percentage}%</p>
                </div>
            )}
            <button className="btn_1 mt-4" onClick={onComplete}>
                <i className="fas fa-unlock-alt me-2"></i>Mở khóa câu chuyện tiếp theo
            </button>
        </div>
    );
}

export default StoryComplete;