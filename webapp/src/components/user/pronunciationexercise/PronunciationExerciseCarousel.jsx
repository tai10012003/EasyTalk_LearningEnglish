import React, { useState, useCallback } from 'react';
import Swal from "sweetalert2";

function buildDetailedAnalysis(correctSentence, transcription) {
    const correctWords = correctSentence
        .replace(/[^a-zA-Z\s]/g, '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

    const spokenWords = transcription
        .replace(/[^a-zA-Z\s]/g, '')
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);

    return correctWords.map((word, idx) => {
        const spokenWord = spokenWords[idx] || null;
        return {
            correct: word,
            spoken: spokenWord,
            isCorrect: spokenWord == word
        };
    });
}

function normalizeOptions(options = []) {
    if (!Array.isArray(options)) return [];
    return options.map(option => String(option || "").trim()).filter(Boolean);
}

const PronunciationExerciseCarousel = ({
    questions,
    currentQuestionIndex,
    onCheckAnswer,
    onAnalyzePronunciation,
    onAnswerSubmit,
    onQuestionNavigation,
    onSpeakText,
    questionResults,
    isCompleted
}) => {
    const [recordingState, setRecordingState] = useState({});
    const [audioSrc, setAudioSrc] = useState({});
    const [analysisResults, setAnalysisResults] = useState({});
    const [analyzingState, setAnalyzingState] = useState({});
    const [mediaRecorders, setMediaRecorders] = useState({});
    const [checkingState, setCheckingState] = useState({});
    const currentQuestion = questions[currentQuestionIndex];
    const isQuestionAnswered = questionResults[currentQuestionIndex]?.userAnswer !== "Chưa trả lời";
    const currentAnalysisResult = analysisResults[currentQuestionIndex];
    const isAnalyzing = Boolean(analyzingState[currentQuestionIndex]);
    const [micError, setMicError] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [pronunciationAttempts, setPronunciationAttempts] = useState({});

    const getQuestionTitle = () => {
        switch (currentQuestion.type) {
            case 'multiple-choice':
                return 'Nghe và chọn đáp án đúng:';
            case 'pronunciation':
                return 'Phát âm lại sao cho đúng:';
            default:
                return 'Câu hỏi:';
        }
    };

    const handleRecordToggle = useCallback(async () => {
        const questionIndex = currentQuestionIndex;

        if (recordingState[questionIndex]) {
            const recorder = mediaRecorders[questionIndex];
            if (recorder) recorder.stop();
            setRecordingState(prev => ({ ...prev, [questionIndex]: false }));
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            Swal.fire({
                icon: "warning",
                title: "Cảnh báo",
                text: "Trình duyệt không hỗ trợ ghi âm."
            });
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            let audioChunks = [];
            mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioURL = URL.createObjectURL(audioBlob);
                setAudioSrc(prev => ({ ...prev, [questionIndex]: audioURL }));
                setAnalyzingState(prev => ({ ...prev, [questionIndex]: true }));
                try {
                    const response = await onAnalyzePronunciation(
                        questionIndex,
                        audioBlob
                    );

                    if (response?.success) {
                        response.detailedAnalysisWords = buildDetailedAnalysis(
                            response.correctAnswer || currentQuestion.question,
                            response.transcription || ""
                        );
                    }
                    setAnalysisResults(prev => ({ ...prev, [questionIndex]: response }));
                    setPronunciationAttempts(prev => ({
                        ...prev,
                        [questionIndex]: (prev[questionIndex] || 0) + 1
                    }));

                    if (response?.success) {
                        onAnswerSubmit(questionIndex, response);
                    }
                } catch (error) {
                    setAnalysisResults(prev => ({
                        ...prev,
                        [questionIndex]: {
                            success: false,
                            message: error.message || "Không thể phân tích phát âm. Vui lòng thử lại."
                        }
                    }));
                } finally {
                    setAnalyzingState(prev => ({ ...prev, [questionIndex]: false }));
                    stream.getTracks().forEach(track => track.stop());
                }
            };
            setMicError(null);
            mediaRecorder.start();
            setMediaRecorders(prev => ({ ...prev, [questionIndex]: mediaRecorder }));
            setRecordingState(prev => ({ ...prev, [questionIndex]: true }));
        } catch (err) {
            console.error(err);
            if (err.name == "NotAllowedError") {
                setMicError("Bạn đã chặn quyền micro. Vui lòng bật lại trong trình duyệt.");
            } else if (err.name == "NotFoundError") {
                setMicError("Không tìm thấy thiết bị micro. Hãy kiểm tra lại máy của bạn.");
            } else {
                setMicError("Không thể truy cập micro: " + err.message);
            }
        }
    }, [currentQuestionIndex, mediaRecorders, recordingState, currentQuestion, onAnalyzePronunciation, onAnswerSubmit]);

    const handleMultipleChoiceSubmit = useCallback(async () => {
        const questionIndex = currentQuestionIndex;
        const selectedInput = document.querySelector(`input[name="answer-${questionIndex}"]:checked`);
        if (!selectedInput) {
            Swal.fire({
                icon: "warning",
                title: "Cảnh báo",
                text: "Vui lòng chọn một đáp án."
            });
            return;
        }
        const userAnswer = selectedInput.value;
        try {
            setCheckingState(prev => ({ ...prev, [questionIndex]: true }));
            const result = await onCheckAnswer(questionIndex, userAnswer);
            onAnswerSubmit(questionIndex, result);
        } catch (error) {
            console.error("Error checking pronunciation exercise answer:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.message || "Có lỗi xảy ra khi kiểm tra câu trả lời."
            });
        } finally {
            setCheckingState(prev => ({ ...prev, [questionIndex]: false }));
        }
    }, [currentQuestionIndex, onCheckAnswer, onAnswerSubmit]);

    const handleAnswerChange = useCallback((value) => {
        setUserAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: value
        }));
    }, [currentQuestionIndex]);

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) onQuestionNavigation(currentQuestionIndex + 1);
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) onQuestionNavigation(currentQuestionIndex - 1);
    };

    return (
        <div className="exercise-carousel-container">
            <div className="exercise-question-card">
                <h4 className="exercise-question-title">{getQuestionTitle()}</h4>

                <form className="exercise-question-form-container mt-4">
                    {currentQuestion.type == 'multiple-choice' && (
                        <>
                            <h5 id={`exercise-ques-${currentQuestionIndex}`}>
                                {onSpeakText && (
                                    <button
                                        className="exercise-speak-button-pronun btn-sm btn-outline mr-2"
                                        onClick={() => onSpeakText(currentQuestion.question)}
                                        type="button"
                                    >
                                        🔊
                                    </button>
                                )}
                            </h5>
                            <div className="exercise-question-form">
                                {normalizeOptions(currentQuestion.options)
                                .map((option, optIndex) => (
                                    <div key={optIndex} className="exercise-form-check">
                                        <input
                                            className="exercise-form-check-input"
                                            type="radio"
                                            name={`answer-${currentQuestionIndex}`}
                                            value={option}
                                            id={`exercise-option-${optIndex}-${currentQuestionIndex}`}
                                            checked={userAnswers[currentQuestionIndex] == option}
                                            disabled={isQuestionAnswered || isCompleted}
                                            onChange={() => handleAnswerChange(option)}
                                        />
                                        <label
                                            className={`exercise-form-check-label ${
                                                isQuestionAnswered && questionResults[currentQuestionIndex].correctAnswer == option
                                                    ? 'exercise-correct-answer'
                                                    : isQuestionAnswered && questionResults[currentQuestionIndex].userAnswer == option
                                                    ? 'exercise-incorrect-answer'
                                                    : ''
                                            }`}
                                            htmlFor={`exercise-option-${optIndex}-${currentQuestionIndex}`}
                                        >
                                            {option}
                                        </label>
                                    </div>
                                ))}
                                {!isQuestionAnswered && !isCompleted && (
                                    <button
                                        type="button"
                                        className="exercise-submit-answer mt-4 mb-4"
                                        onClick={handleMultipleChoiceSubmit}
                                        disabled={Boolean(checkingState[currentQuestionIndex])}
                                    >
                                        <i className="fas fa-check me-2"></i> {checkingState[currentQuestionIndex] ? "Đang kiểm tra..." : "Kiểm tra"}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                    {currentQuestion.type == 'pronunciation' && (
                        <>
                            <h5 className="exercise-question-text" id={`exercise-ques-${currentQuestionIndex}`}>
                                {onSpeakText && (
                                    <button
                                        className="exercise-speak-button btn-sm btn-outline mr-2"
                                        onClick={() => onSpeakText(currentQuestion.question)}
                                        type="button"
                                    >
                                        🔊
                                    </button>
                                )}
                                {currentQuestion.question}
                            </h5>
                            {(pronunciationAttempts[currentQuestionIndex] || 0) >= 3 ? (
                                <p style={{ color: "red", marginTop: "10px", fontWeight: "bold" }}>
                                    Bạn đã hết số lần phát âm cho câu này (3 lần).
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    className="btn btn_1"
                                    onClick={handleRecordToggle}
                                    disabled={isAnalyzing || isCompleted}
                                >
                                    {recordingState[currentQuestionIndex] ? 'Dừng ghi âm' : isAnalyzing ? 'Đang phân tích...' : 'Ghi âm'}
                                </button>
                            )}
                            {micError && (
                                <div style={{ color: "red", marginTop: "10px", fontWeight: "bold" }}>
                                    {micError}
                                </div>
                            )}
                            {audioSrc[currentQuestionIndex] && (
                                <div className="mt-2">
                                    <audio controls src={audioSrc[currentQuestionIndex]} />
                                </div>
                            )}

                            {isAnalyzing && (
                                <div className="exercise-explanation mt-4">
                                    <p><strong>Đang phân tích phát âm...</strong></p>
                                </div>
                            )}

                            {currentAnalysisResult && !currentAnalysisResult.success && !isAnalyzing && (
                                <div className="exercise-explanation mt-4">
                                    <p>
                                        <strong>Chưa phân tích được phát âm.</strong>
                                        <br />
                                        {currentAnalysisResult.message || "Vui lòng ghi âm lại và thử thêm lần nữa."}
                                    </p>
                                </div>
                            )}

                            {currentAnalysisResult?.success && (
                                <div className="exercise-explanation mt-4">
                                    <h5>
                                        Độ chính xác:{' '}
                                        <span
                                            style={{
                                                color:
                                                    Number(currentAnalysisResult.accuracy || 0) >= 75
                                                        ? 'green'
                                                        : Number(currentAnalysisResult.accuracy || 0) >= 50
                                                        ? 'orange'
                                                        : 'red'
                                            }}
                                        >
                                            {Number(currentAnalysisResult.accuracy || 0).toFixed(2)}%
                                        </span>
                                    </h5>

                                    <p
                                        style={{
                                            color:
                                                Number(currentAnalysisResult.accuracy || 0) < 50
                                                    ? 'red'
                                                    : Number(currentAnalysisResult.accuracy || 0) < 75
                                                    ? 'orange'
                                                    : 'green'
                                        }}
                                    >
                                        {currentAnalysisResult.message || "Đã phân tích phát âm của bạn."}
                                    </p>

                                    <p style={{ marginTop: '15px' }}>
                                    <strong>Kết quả phân tích:</strong> "{currentAnalysisResult.transcription}"
                                </p>

                                    <p>
                                        <strong>Chi tiết phát âm: </strong>
                                        {(currentAnalysisResult.detailedAnalysisWords || []).map((word, idx) => (
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
                                </div>
                            )}
                        </>
                    )}
                    {isQuestionAnswered && currentQuestion.type == 'multiple-choice' && (
                        <div className="exercise-explanation mt-4">
                            {questionResults[currentQuestionIndex].isCorrect ? (
                                <p>
                                    <strong>Bạn đã trả lời đúng.</strong>
                                    <br />
                                    Giải thích: {questionResults[currentQuestionIndex].explanation}
                                </p>
                            ) : (
                                <p>
                                    <strong>Bạn đã trả lời sai.</strong> Đáp án đúng: <strong>{questionResults[currentQuestionIndex].correctAnswer}</strong>
                                    <br />
                                    Giải thích: {questionResults[currentQuestionIndex].explanation}
                                </p>
                            )}
                        </div>
                    )}
                </form>
                <div className="d-flex justify-content-between mt-4">
                    {currentQuestionIndex > 0 && (
                        <button 
                            className="btn_2" 
                            style={{ marginRight: '20px' }} 
                            onClick={handlePrev}
                        >
                            <i className="fas fa-arrow-left"></i> Quay lại
                        </button>
                    )}
                    {currentQuestionIndex < questions.length - 1 && (
                        <button 
                            className="btn_2" 
                            onClick={handleNext}
                            style={{ marginLeft: currentQuestionIndex === 0 ? 'auto' : '0' }}
                        >
                            <i className="fas fa-arrow-right"></i> Tiếp theo
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PronunciationExerciseCarousel;
