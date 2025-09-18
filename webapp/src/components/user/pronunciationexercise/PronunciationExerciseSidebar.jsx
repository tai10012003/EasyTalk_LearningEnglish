import React, { useCallback } from 'react';

const PronunciationExerciseSidebar = ({
        timeRemaining,
        formatTime,
        questions,
        questionResults,
        currentQuestionIndex,
        isCompleted,
        onSubmitQuiz,
        onQuestionNavigation,
        onShowHistory,
        selectedDuration
    }) => {
        const handleSubmitClick = useCallback(() => {
            if (window.confirm('Bạn có chắc chắn muốn nộp bài?')) {
                onSubmitQuiz();
            }
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

    return (
        <div className="exercise-sidebar">
            {!isCompleted ? (
                <>
                    <div className="exercise-time-remaining text-center">
                        <span id="exercise-timeLabel">Thời gian còn lại: </span>
                        <span id="exercise-time">{formatTime(timeRemaining)}</span>
                    </div>
                    
                    <button
                        id="exercise-submitQuizBtn"
                        className="btn_1 mb-4"
                        style ={{ width: '100%' }}
                        onClick={handleSubmitClick}
                    >
                        Nộp bài
                    </button>
                    
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

export default PronunciationExerciseSidebar;