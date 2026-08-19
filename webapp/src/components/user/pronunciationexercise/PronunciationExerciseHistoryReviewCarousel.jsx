import React from 'react';

const buildDetailedAnalysis = (correctSentence = "", transcription = "") => {
    const correctWords = correctSentence.replace(/[^a-zA-Z\s]/g, '').toLowerCase().split(/\s+/).filter(Boolean);
    const spokenWords = transcription.replace(/[^a-zA-Z\s]/g, '').toLowerCase().split(/\s+/).filter(Boolean);
    return correctWords.map((word, idx) => {
        const spokenWord = spokenWords[idx] || null;
        return {
            correct: word,
            spoken: spokenWord,
            isCorrect: spokenWord === word
        };
    });
};

const normalizeOptions = (options = []) => {
    if (!Array.isArray(options)) return [];
    return options.map(option => String(option || "").trim()).filter(Boolean);
};

const PronunciationExerciseHistoryReviewCarousel = ({
    questionResults,
    currentQuestionIndex,
    onQuestionNavigation
}) => {
    const currentQuestion = questionResults[currentQuestionIndex];

    const getQuestionTitle = () => {
        switch (currentQuestion?.type) {
            case 'multiple-choice': return 'Nghe và chọn đáp án đúng:';
            case 'pronunciation': return 'Phát âm lại sao cho đúng:';
            default: return 'Câu hỏi:';
        }
    };

    const renderMultipleChoice = () => {
        const options = normalizeOptions(currentQuestion?.options);
        return (
            <div className="exercise-question-form">
                {options.map((option, optIndex) => {
                    const isUserAnswer = currentQuestion.userAnswer === option;
                    const isCorrectAnswer = currentQuestion.correctAnswer === option;
                    return (
                        <div key={optIndex} className="exercise-form-check">
                            <input
                                className="exercise-form-check-input"
                                type="radio"
                                name={`pronunciation-history-answer-${currentQuestionIndex}`}
                                value={option}
                                id={`pronunciation-history-option-${optIndex}-${currentQuestionIndex}`}
                                checked={isUserAnswer}
                                disabled
                                readOnly
                            />
                            <label
                                className={`exercise-form-check-label ${
                                    isUserAnswer && !currentQuestion.isCorrect ? 'exercise-incorrect-answer' : ''
                                } ${
                                    isCorrectAnswer ? 'exercise-correct-answer' : ''
                                }`}
                                htmlFor={`pronunciation-history-option-${optIndex}-${currentQuestionIndex}`}
                            >
                                {option}
                            </label>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderPronunciationResult = () => {
        const accuracy = Number(currentQuestion?.accuracy || 0);
        const words = currentQuestion?.detailedResult?.length
            ? currentQuestion.detailedResult.map(item => ({
                correct: item.word || item.correct,
                spoken: item.userSaid || item.spoken,
                isCorrect: item.correct === true || item.isCorrect === true
            }))
            : buildDetailedAnalysis(currentQuestion?.correctAnswer, currentQuestion?.transcription || currentQuestion?.userAnswer);

        return (
            <div className="exercise-explanation mt-4">
                <h5>
                    Độ chính xác:{" "}
                    <span style={{ color: accuracy >= 75 ? "green" : accuracy >= 50 ? "orange" : "red" }}>
                        {accuracy.toFixed(2)}%
                    </span>
                </h5>
                <p style={{ marginTop: "15px" }}>
                    <strong>Kết quả phân tích:</strong> "{currentQuestion?.transcription || currentQuestion?.userAnswer || "Chưa trả lời"}"
                </p>
                <p>
                    <strong>Câu chuẩn:</strong> {currentQuestion?.correctAnswer}
                </p>
                <p>
                    <strong>Chi tiết phát âm: </strong>
                    {words.map((word, idx) => (
                        <span key={idx} style={{ marginRight: "12px" }}>
                            {word.isCorrect ? (
                                <span style={{ color: "green", fontWeight: "bold" }}>{word.correct}</span>
                            ) : (
                                <>
                                    <span style={{ color: "red", textDecoration: "line-through" }}>
                                        {word.spoken || "∅"}
                                    </span>
                                    <span style={{ color: "blue", marginLeft: "4px" }}>
                                        ({word.correct})
                                    </span>
                                </>
                            )}
                        </span>
                    ))}
                </p>
                {currentQuestion?.explanation && (
                    <p>Giải thích: {currentQuestion.explanation}</p>
                )}
            </div>
        );
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questionResults.length - 1) {
            onQuestionNavigation(currentQuestionIndex + 1);
        }
    };

    const handlePrevQuestion = () => {
        if (currentQuestionIndex > 0) {
            onQuestionNavigation(currentQuestionIndex - 1);
        }
    };

    if (!currentQuestion) return null;

    return (
        <div className="exercise-carousel-container">
            <div className="exercise-question-card">
                <h4 className="exercise-question-title">{getQuestionTitle()}</h4>
                <h5 className="exercise-question-text">
                    {currentQuestionIndex + 1}. {currentQuestion.question}
                </h5>
                <div className="exercise-question-form-container mt-4">
                    {currentQuestion.type === "multiple-choice" ? (
                        <>
                            {renderMultipleChoice()}
                            <div className="exercise-explanation mt-4">
                                {currentQuestion.isCorrect ? (
                                    <p>
                                        <strong>Bạn đã trả lời đúng!</strong><br />
                                        Giải thích: {currentQuestion.explanation}
                                    </p>
                                ) : (
                                    <p>
                                        <strong>Bạn đã trả lời sai.</strong> Đáp án đúng là: <strong>{currentQuestion.correctAnswer}</strong><br />
                                        Giải thích: {currentQuestion.explanation}
                                    </p>
                                )}
                            </div>
                        </>
                    ) : renderPronunciationResult()}
                </div>
                <hr />
                <div className="d-flex justify-content-between mt-3">
                    {currentQuestionIndex > 0 && (
                        <button className="btn_2" style={{ marginRight: '20px', marginTop: '20px' }} type="button" onClick={handlePrevQuestion}>
                            <i className="fas fa-arrow-left"></i> Quay lại
                        </button>
                    )}
                    {currentQuestionIndex < questionResults.length - 1 && (
                        <button className="btn_2" type="button" onClick={handleNextQuestion} style={{ marginLeft: currentQuestionIndex === 0 ? 'auto' : '0' }}>
                            <i className="fas fa-arrow-right"></i> Tiếp theo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PronunciationExerciseHistoryReviewCarousel;
