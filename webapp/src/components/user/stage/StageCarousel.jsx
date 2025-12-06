import React, { useState, useCallback, useEffect } from 'react';
import { isAnswerCorrect } from '@/utils/englishTextNormalizer'
import Swal from "sweetalert2";

const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const StageCarousel = ({
    questions,
    currentQuestionIndex,
    onAnswerSubmit,
    onQuestionNavigation,
    onSpeakText,
    questionResults,
    isCompleted,
    onSubmitStage
}) => {
    const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
    const [userAnswers, setUserAnswers] = useState({});
    const [arrangeState, setArrangeState] = useState({});
    const [hoveredWord, setHoveredWord] = useState(null);
    const [translation, setTranslation] = useState('');
    const [translationLoading, setTranslationLoading] = useState(false);
    const [shuffledOptionsMap, setShuffledOptionsMap] = useState({});

    useEffect(() => {
        const newShuffledMap = {};
        questions.forEach((question, index) => {
            if (!shuffledOptionsMap[index]) {
                if (question.type === "multiple-choice" || question.type === "arrange-words") {
                    newShuffledMap[index] = shuffleArray(question.options.filter(o => o.trim() !== ""));
                } else {
                    newShuffledMap[index] = question.options;
                }
            }
        });
        if (Object.keys(newShuffledMap).length > 0) {
            setShuffledOptionsMap(prev => ({ ...prev, ...newShuffledMap }));
        }
    }, [questions]);

    const currentQuestion = questions[currentQuestionIndex];
    const currentShuffledOptions = shuffledOptionsMap[currentQuestionIndex] || currentQuestion?.options || [];

    const isEnglishQuestion = (text) => {
        if (!text) return false;
        const cleanText = text.replace(/[0-9\s.,?!()_\-]/g, '');
        const vietnameseRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
        if (vietnameseRegex.test(cleanText)) return false;
        const englishRegex = /[a-z]/i;
        return englishRegex.test(cleanText);
    };

    const translateWord = async (word, sourceLang, targetLang) => {
        try {
            setTranslationLoading(true);
            const cleanWord = word.replace(/[.,?!;:()]/g, '').trim();
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(cleanWord)}`);
            const data = await response.json();
            if (data && data[0] && data[0][0] && data[0][0][0]) {
                setTranslation(data[0][0][0]);
            } else {
                setTranslation('Không tìm thấy nghĩa');
            }
        } catch (error) {
            console.error('Translation error:', error);
            setTranslation('Lỗi dịch');
        } finally {
            setTranslationLoading(false);
        }
    };

    const handleWordHover = (word) => {
        if (!word || word.trim() == '') return;
        setHoveredWord(word);
        const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(word);
        if (isVietnamese) {
            translateWord(word, 'vi', 'en');
        } else {
            translateWord(word, 'en', 'vi');
        }
    };

    const handleWordLeave = () => {
        setHoveredWord(null);
        setTranslation('');
    };

    const handleAnswerChange = useCallback((value) => {
        setUserAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: value
        }));
    }, [currentQuestionIndex]);

    const handleSubmitAnswer = useCallback(() => {
        const userAnswer = userAnswers[currentQuestionIndex];
        if (!userAnswer || userAnswer.toString().trim() == '') {
            Swal.fire({
                icon: "warning",
                title: "Cảnh báo",
                text: "Vui lòng nhập hoặc chọn câu trả lời!"
            });
            return;
        }
        const rawUserAnswer = userAnswer.toString().trim();
        const correctAnswer = currentQuestion.correctAnswer?.trim() || "";
        const isCorrect = isAnswerCorrect(rawUserAnswer, correctAnswer);
        onAnswerSubmit(currentQuestionIndex, rawUserAnswer, isCorrect);
        setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
    }, [currentQuestionIndex, userAnswers, currentQuestion, onAnswerSubmit]);

    const handleNextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            onQuestionNavigation(currentQuestionIndex + 1);
        }
    }, [currentQuestionIndex, questions.length, onQuestionNavigation]);

    const isQuestionAnswered = answeredQuestions.has(currentQuestionIndex);
    const questionResult = questionResults[currentQuestionIndex];

    const renderArrangeWords = () => {
        if (!currentQuestion || currentQuestion.type !== "arrange-words") return null;
        const words = currentShuffledOptions;
        const savedAnswer = userAnswers[currentQuestionIndex];
        const savedSelected = savedAnswer ? savedAnswer.split(" ").filter(Boolean) : [];
        if (!arrangeState[currentQuestionIndex]) {
            setArrangeState(prev => ({
                ...prev,
                [currentQuestionIndex]: {
                    selected: savedSelected,
                    available: words.filter(w => !savedSelected.includes(w))
                }
            }));
        }
        const state = arrangeState[currentQuestionIndex] || {
            selected: savedSelected,
            available: words.filter(w => !savedSelected.includes(w))
        };
        const correctWords = currentQuestion.correctAnswer.trim().split(" ");
        const isWordCorrectAtPosition = (word, index) => {
            if (index >= correctWords.length) return false;
            return word.toLowerCase() === correctWords[index].toLowerCase().replace(/[.,?!]/g, '');
        };
        const handleWordClick = (word, fromSelected = false) => {
            if (isQuestionAnswered) return;
            let newSelected, newAvailable;
            if (fromSelected) {
                newSelected = state.selected.filter(w => w !== word);
                newAvailable = [...state.available, word];
            } else {
                newSelected = [...state.selected, word];
                newAvailable = state.available.filter(w => w !== word);
            }
            setArrangeState(prev => ({
                ...prev,
                [currentQuestionIndex]: { selected: newSelected, available: newAvailable }
            }));
            handleAnswerChange(newSelected.join(" "));
        };
        return (
            <div className="arrange-words-container">
                <div className="selected-words-area">
                    {state.selected.length == 0 ? (
                        <div className="placeholder-text">
                            Bấm vào các từ bên dưới để sắp xếp thành câu
                        </div>
                    ) : (
                        state.selected.map((word, idx) => {
                            const isCorrect = isQuestionAnswered && isWordCorrectAtPosition(word, idx);
                            const isIncorrect = isQuestionAnswered && !isWordCorrectAtPosition(word, idx);
                            return (
                                <div key={idx} className={`word-chip selected ${isCorrect ? 'correct-position' : ''} ${isIncorrect ? 'incorrect-position' : ''}`} onClick={() => handleWordClick(word, true)}>
                                    {word}
                                </div>
                            );
                        })
                    )}
                </div>
                <div className="available-words-pool">
                    {state.available.map((word, idx) => (
                        <div key={idx} className="word-chip available" onClick={() => handleWordClick(word, false)}>
                            {word}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderMultipleChoice = () => (
        <div className="exercise-question-form">
            {currentShuffledOptions.map((option, optIndex) => {
                const isUserAnswer = isQuestionAnswered && questionResult?.userAnswer == option;
                const isCorrectAnswer = isQuestionAnswered && questionResult?.correctAnswer == option;
                return (
                    <div key={optIndex} className="exercise-form-check">
                        <input
                            className="exercise-form-check-input"
                            type="radio"
                            name={`exercise-answer-${currentQuestionIndex}`}
                            value={option}
                            id={`exercise-option-${optIndex}-${currentQuestionIndex}`}
                            onChange={() => handleAnswerChange(option)}
                            checked={userAnswers[currentQuestionIndex] == option}
                            disabled={isQuestionAnswered}
                        />
                        <label
                            className={`exercise-form-check-label ${
                                isUserAnswer && !questionResult.isCorrect ? 'exercise-incorrect-answer' : ''
                            } ${
                                isCorrectAnswer ? 'exercise-correct-answer' : ''
                            }`}
                            htmlFor={`exercise-option-${optIndex}-${currentQuestionIndex}`}
                        >
                            {option}
                        </label>
                    </div>
                );
            })}
        </div>
    );

    const renderTextInput = () => (
        <div className="exercise-question-form">
            <textarea
                className={`form-control exercise-question-input ${
                    isQuestionAnswered
                        ? questionResult?.isCorrect
                            ? 'exercise-correct-answer'
                            : 'exercise-incorrect-answer'
                        : ''
                }`}
                name="exercise-answer"
                rows="4"
                placeholder="Nhập câu trả lời Tiếng Anh của bạn ..."
                value={userAnswers[currentQuestionIndex] || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                disabled={isQuestionAnswered}
            />
        </div>
    );

    const renderQuestionContent = () => {
        if (!currentQuestion) return null;
        if (currentQuestion.type == "multiple-choice") return renderMultipleChoice();
        if (currentQuestion.type == "arrange-words") return renderArrangeWords();
        return renderTextInput();
    };

    const getQuestionTitle = () => {
        switch (currentQuestion?.type) {
            case 'multiple-choice': return 'Chọn đáp án đúng:';
            case 'fill-in-the-blank': return 'Điền vào chỗ trống:';
            case 'translation': return 'Dịch câu (Tiếng Việt) dưới đây sang câu (Tiếng Anh):';
            case 'arrange-words': return 'Sắp xếp các từ thành câu hoàn chỉnh:';
            default: return 'Câu hỏi:';
        }
    };

    const shouldShowSpeaker = isEnglishQuestion(currentQuestion?.question);
    if (!currentQuestion) return null;

    return (
        <div className="exercise-carousel-container">
            <div className="exercise-question-card">
                <h4 className="exercise-question-title">{getQuestionTitle()}</h4>
                <h5 className="exercise-question-text" id={`exercise-ques-${currentQuestionIndex}`}>
                    {shouldShowSpeaker && (
                        <button
                            className="exercise-speak-button btn-sm btn-outline mr-2"
                            onClick={() => onSpeakText(currentQuestion.question)}
                            type="button"
                            title="Phát âm câu hỏi"
                        >
                            🔊
                        </button>
                    )}
                    {currentQuestionIndex + 1}.{' '}
                    {currentQuestion.question.split(/(\s+)/).map((part, idx) => {
                        const word = part.trim();
                        if (!word || /^\s+$/.test(part)) return <span key={idx}>{part}</span>;
                        const isWord = /[a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(word);
                        if (!isWord) return <span key={idx}>{part}</span>;
                        return (
                            <span key={idx} className="hoverable-word" onMouseEnter={() => handleWordHover(word)} onMouseLeave={handleWordLeave}>
                                {part}
                                {hoveredWord === word && (
                                    <span className="word-translation-tooltip">
                                        {translationLoading ? '...' : translation}
                                    </span>
                                )}
                            </span>
                        );
                    })}
                </h5>
                <div className="exercise-question-form-container mt-4">
                    {renderQuestionContent()}
                    {isQuestionAnswered && questionResult && (
                        <div className="exercise-explanation mt-4">
                            {questionResult.isCorrect ? (
                                <p>
                                    <strong>Bạn đã trả lời đúng.</strong><br />
                                    Giải thích: {questionResult.explanation}
                                </p>
                            ) : (
                                <p>
                                    <strong>Bạn đã trả lời sai.</strong> Đáp án đúng là: <strong>{questionResult.correctAnswer}</strong><br />
                                    Giải thích: {questionResult.explanation}
                                </p>
                            )}
                        </div>
                    )}
                    {!isQuestionAnswered && !isCompleted && (
                        <button
                            type="button"
                            className="exercise-submit-answer mt-4 mb-4"
                            onClick={handleSubmitAnswer}
                        >
                            Kiểm tra
                        </button>
                    )}
                </div>
                {isQuestionAnswered && !isCompleted && (
                    <div className="d-flex justify-content-end mt-3">
                        {currentQuestionIndex == questions.length - 1 ? (
                            <button
                                className="btn_2 mt-4 mb-4"
                                style ={{ width: '100%' }}
                                type="button"
                                onClick={onSubmitStage}
                            >
                                HOÀN THÀNH
                            </button>
                        ) : (
                            <button
                                className="btn_1 mt-4 mb-4"
                                style ={{ width: '100%' }}
                                type="button"
                                onClick={handleNextQuestion}
                            >
                                Tiếp tục
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StageCarousel;