import React, { useCallback } from 'react';
import Swal from "sweetalert2";

const VocabularyExerciseSidebar = ({
        timeRemaining,
        formatTime,
        questions,
        questionResults,
        currentQuestionIndex,
        isCompleted,
        onSubmitQuiz,
        onQuestionNavigation,
        onShowHistory,
        selectedDuration,
        answeredCount
    }) => {
        const handleSubmitClick = useCallback(() => {
            Swal.fire({
                title: 'Xác nhận',
                text: 'Bạn có chắc chắn muốn nộp bài?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Đồng ý',
                cancelButtonText: 'Hủy'
            }).then((result) => {
                if (result.isConfirmed) {
                    onSubmitQuiz();
                }
            });
        }, [onSubmitQuiz]);

        const getCompletedTime = () => {
            const timeTaken = selectedDuration - timeRemaining;
            const minutes = Math.floor(timeTaken / 60);
            const seconds = timeTaken % 60;
            return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
        };

        const getQuestionButtonColor = (index) => {
        const result = questionResults[index];
        if (!result || result.userAnswer == "Chưa trả lời") {
            return {};
        }

        if (result.isCorrect) {
            return { backgroundColor: "#28a745", color: "white", border: "1px solid #28a745" };
        } else {
            return { backgroundColor: "#dc3545", color: "white", border: "1px solid #dc3545" };
        }
    };

    const allQuestionsAnswered = answeredCount === questions.length;

    return (
        <div className="exercise-sidebar">
            {!isCompleted ? (
                <>
                    <div className="exercise-time-remaining text-center">
                        <span id="exercise-timeLabel">Thời gian còn lại: </span>
                        <span id="exercise-time">{formatTime(timeRemaining)}</span>
                    </div>
                    {allQuestionsAnswered && (
                        <button
                            id="exercise-submitQuizBtn"
                            className="btn_1 mb-4"
                            style={{ width: '100%' }}
                            onClick={handleSubmitClick}
                        >
                            <i class="fas fa-paper-plane"></i> Nộp bài
                        </button>
                    )}
                    {!allQuestionsAnswered && (
                        <div className="text-center mb-4">
                            Đã trả lời: {answeredCount}/{questions.length} câu
                        </div>
                    )}
                    <h5 id="exercise-questionListTitle">Danh sách câu hỏi:</h5>
                    <div className="exercise-question-list mt-3" id="exercise-question-list">
                        {questions.map((_, index) => (
                            <button
                                key={index}
                                className={`exercise-question-number ${
                                    index == currentQuestionIndex ? 'active' : ''
                                }`}
                                id={`exercise-question-btn-${index}`}
                                onClick={() => onQuestionNavigation(index)}
                                style={getQuestionButtonColor(index)}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <div id="exercise-completed-info" className="text-center">
                    <h4>Thời gian đã làm: <span id="exercise-completedTime">{getCompletedTime()}</span></h4>
                    <button
                        className="btn btn-secondary mt-3"
                        id="exercise-viewHistoryBtn"
                        onClick={onShowHistory}
                    >
                        Xem lịch sử
                    </button>
                </div>
            )}
        </div>
    );
};

export default VocabularyExerciseSidebar;