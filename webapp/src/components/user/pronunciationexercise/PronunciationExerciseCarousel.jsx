import React, { useState, useCallback } from 'react';
import { PronunciationExerciseService } from "@/services/PronunciationExerciseService.jsx";

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

const PronunciationExerciseCarousel = ({
    questions,
    currentQuestionIndex,
    onAnswerSubmit,
    onQuestionNavigation,
    onSpeakText,
    questionResults,
    isCompleted
}) => {
    const [recordingState, setRecordingState] = useState({});
    const [audioSrc, setAudioSrc] = useState({});
    const [analysisResults, setAnalysisResults] = useState({});
    const [mediaRecorders, setMediaRecorders] = useState({});
    const exerciseId = window.location.pathname.split('/').pop();
    const currentQuestion = questions[currentQuestionIndex];
    const isQuestionAnswered = questionResults[currentQuestionIndex]?.userAnswer !== "Chưa trả lời";
    const [micError, setMicError] = useState(null);
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
            alert('Trình duyệt không hỗ trợ ghi âm.');
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
                const response = await PronunciationExerciseService.analyzePronunciation(
                    exerciseId,
                    questionIndex,
                    audioBlob
                );

                if (response?.success) {
                    response.detailedAnalysisWords = buildDetailedAnalysis(
                        currentQuestion.question,
                        response.transcription
                    );
                }
                setAnalysisResults(prev => ({ ...prev, [questionIndex]: response }));
                setPronunciationAttempts(prev => ({
                    ...prev,
                    [questionIndex]: (prev[questionIndex] || 0) + 1
                }));
                const accuracy = Number(response?.accuracy || 0);
                const isCorrect = accuracy >= 50;
                onAnswerSubmit(
                    questionIndex,
                    response?.transcription || "Không rõ",
                    isCorrect,
                    accuracy
                );
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
    }, [currentQuestionIndex, exerciseId, mediaRecorders, recordingState, currentQuestion]);

    const handleMultipleChoiceSubmit = useCallback(() => {
        const questionIndex = currentQuestionIndex;
        const selectedInput = document.querySelector(`input[name="answer-${questionIndex}"]:checked`);
        if (!selectedInput) {
            alert('Vui lòng chọn một đáp án.');
            return;
        }
        const userAnswer = selectedInput.value;
        const isCorrect = userAnswer == currentQuestion.correctAnswer;
        onAnswerSubmit(questionIndex, userAnswer, isCorrect);
    }, [currentQuestionIndex, currentQuestion, onAnswerSubmit]);

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
                                {currentQuestion.options
                                .filter(option => option.trim() !== "")
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
                                        />
                                        <label
                                            className={`exercise-form-check-label ${
                                                isQuestionAnswered && currentQuestion.correctAnswer == option
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
                                    >
                                        Kiểm tra
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
                                >
                                    {recordingState[currentQuestionIndex] ? 'Dừng ghi âm' : 'Ghi âm'}
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

                            {analysisResults[currentQuestionIndex]?.success && (
                                <div className="exercise-explanation mt-4">
                                    <h5>
                                        Độ chính xác:{' '}
                                        <span
                                            style={{
                                                color:
                                                    Number(analysisResults[currentQuestionIndex].accuracy || 0) >= 75
                                                        ? 'green'
                                                        : Number(analysisResults[currentQuestionIndex].accuracy || 0) >= 50
                                                        ? 'orange'
                                                        : 'red'
                                            }}
                                        >
                                            {Number(analysisResults[currentQuestionIndex].accuracy || 0).toFixed(2)}%
                                        </span>
                                    </h5>

                                    <p
                                        style={{
                                            color:
                                                Number(analysisResults[currentQuestionIndex].accuracy || 0) < 50
                                                    ? 'red'
                                                    : Number(analysisResults[currentQuestionIndex].accuracy || 0) < 75
                                                    ? 'orange'
                                                    : 'green'
                                        }}
                                    >
                                        {analysisResults[currentQuestionIndex].message}
                                    </p>

                                    <p style={{ marginTop: '15px' }}>
                                        <strong>Kết quả phân tích:</strong> "{analysisResults[currentQuestionIndex].transcription}"
                                    </p>

                                    <p>
                                        <strong>Chi tiết phát âm: </strong>
                                        {(analysisResults[currentQuestionIndex].detailedAnalysisWords || []).map((word, idx) => (
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
                                    <strong>Bạn đã trả lời sai.</strong> Đáp án đúng: <strong>{currentQuestion.correctAnswer}</strong>
                                    <br />
                                    Giải thích: {questionResults[currentQuestionIndex].explanation}
                                </p>
                            )}
                        </div>
                    )}
                </form>

                <div className="d-flex justify-content-between mt-4" >
                    <button className="btn_2" style={{ marginRight: '20px' }} onClick={handlePrev} disabled={currentQuestionIndex == 0}>
                        Quay lại
                    </button>
                    <button className="btn_2" onClick={handleNext} disabled={currentQuestionIndex == questions.length - 1}>
                        Tiếp theo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PronunciationExerciseCarousel;
