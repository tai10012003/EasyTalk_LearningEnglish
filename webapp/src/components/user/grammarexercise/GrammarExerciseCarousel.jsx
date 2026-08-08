import React, { useState, useEffect, useCallback } from 'react';
import { isAnswerCorrect } from '@/utils/englishTextNormalizer'
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

const GrammarExerciseCarousel = ({
    questions,
    currentQuestionIndex,
    onAnswerSubmit,
    onQuestionNavigation,
    onSpeakText,
    questionResults,
    isCompleted,
    onAnsweredQuestionsChange
}) => {
    const { t } = useTranslation();
    const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
    const [userAnswers, setUserAnswers] = useState({});
    const [arrangeState, setArrangeState] = useState({});
    const [hoveredWord, setHoveredWord] = useState(null);
    const [translation, setTranslation] = useState('');
    const [translationLoading, setTranslationLoading] = useState(false);

    const shuffleArray = useCallback((array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }, []);

    const [shuffledQuestionsData, setShuffledQuestionsData] = useState([]);

    useEffect(() => {
        const shuffledData = questions.map((question) => ({
            ...question,
            shuffledOptions: question.type === "multiple-choice" || question.type === "arrange-words" ? shuffleArray(question.options.filter(o => o.trim() !== "")) : question.options
        }));
        setShuffledQuestionsData(shuffledData);
    }, [questions, shuffleArray]);

    const currentQuestion = shuffledQuestionsData[currentQuestionIndex];

    const isEnglishQuestion = (text) => {
        if (!text) return false;
        const cleanText = text.replace(/[0-9\s.,?!()_-]/g, '');
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
                setTranslation(t("grammarExercisePage.carousel.translationNotFound"));
            }
        } catch (error) {
            console.error('Translation error:', error);
            setTranslation(t("grammarExercisePage.carousel.translationError"));
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

    useEffect(() => {
        if (onAnsweredQuestionsChange) {
            onAnsweredQuestionsChange(answeredQuestions.size);
        }
    }, [answeredQuestions, onAnsweredQuestionsChange]);

    const handleSubmitAnswer = useCallback(() => {
        const userAnswer = userAnswers[currentQuestionIndex];
        if (!userAnswer || userAnswer.toString().trim() == '') {
            Swal.fire({
                icon: "warning",
                title: t("grammarExercisePage.carousel.warningTitle"),
                text: t("grammarExercisePage.carousel.answerRequired")
            });
            return;
        }
        const rawUserAnswer = userAnswer.toString().trim();
        const correctAnswer = currentQuestion.correctAnswer?.trim() || "";
        const isCorrect = isAnswerCorrect(rawUserAnswer, correctAnswer);
        onAnswerSubmit(currentQuestionIndex, rawUserAnswer, isCorrect);
        setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
    }, [currentQuestionIndex, userAnswers, currentQuestion, onAnswerSubmit, t]);

    const handleNextQuestion = useCallback(() => {
        if (currentQuestionIndex < questions.length - 1) {
            onQuestionNavigation(currentQuestionIndex + 1);
        }
    }, [currentQuestionIndex, questions.length, onQuestionNavigation]);

    const handlePrevQuestion = useCallback(() => {
        if (currentQuestionIndex > 0) {
            onQuestionNavigation(currentQuestionIndex - 1);
        }
    }, [currentQuestionIndex, onQuestionNavigation]);

    const isQuestionAnswered = answeredQuestions.has(currentQuestionIndex);
    const questionResult = questionResults[currentQuestionIndex];

    const renderArrangeWords = () => {
        if (!currentQuestion || currentQuestion.type !== "arrange-words") return null;
        const words = currentQuestion.shuffledOptions || [];
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
                            {t("grammarExercisePage.carousel.arrangePlaceholder")}
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

    const renderMultipleChoice = () => {
        const shuffledOptions = currentQuestion?.shuffledOptions || [];
        return (
            <div className="exercise-question-form">
                {shuffledOptions.map((option, optIndex) => {
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
    };

    const renderTextInput = () => {
        return (
            <div className="exercise-question-form">
                <textarea
                    className={`form-control exercise-question-input ${
                        isQuestionAnswered
                            ? questionResult?.isCorrect
                                ? 'exercise-correct-answer'
                                : 'exercise-incorrect-answer'
                            : ''
                    }`}
                    rows="4"
                    placeholder={t("grammarExercisePage.carousel.answerPlaceholder")}
                    value={userAnswers[currentQuestionIndex] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    disabled={isQuestionAnswered}
                />
            </div>
        );
    };

    const renderQuestionContent = () => {
        if (!currentQuestion) return null;
        if (currentQuestion.type == "multiple-choice") return renderMultipleChoice();
        if (currentQuestion.type == "arrange-words") return renderArrangeWords();
        return renderTextInput();
    };

    const getQuestionTitle = () => {
        switch (currentQuestion?.type) {
            case 'multiple-choice': return t("grammarExercisePage.carousel.questionTypes.multipleChoice");
            case 'fill-in-the-blank': return t("grammarExercisePage.carousel.questionTypes.fillBlank");
            case 'translation': return t("grammarExercisePage.carousel.questionTypes.translation");
            case 'arrange-words': return t("grammarExercisePage.carousel.questionTypes.arrange");
            default: return t("grammarExercisePage.carousel.questionTypes.default");
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
                            title={t("grammarExercisePage.carousel.speakTitle")}
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
                                    <strong>{t("grammarExercisePage.carousel.correct")}</strong><br />
                                    {t("grammarExercisePage.carousel.explanation")}: {questionResult.explanation}
                                </p>
                            ) : (
                                <p>
                                    <strong>{t("grammarExercisePage.carousel.incorrect")}</strong> {t("grammarExercisePage.carousel.correctAnswer")}: <strong>{questionResult.correctAnswer}</strong><br />
                                    {t("grammarExercisePage.carousel.explanation")}: {questionResult.explanation}
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
                            <i className="fas fa-check me-2"></i> {t("grammarExercisePage.carousel.check")}
                        </button>
                    )}
                </div>
                <hr />
                <div className="d-flex justify-content-between mt-3">
                    {currentQuestionIndex > 0 && (
                        <button
                            className="btn_2"
                            style={{ marginRight: '20px', marginTop: '20px' }}
                            type="button"
                            onClick={handlePrevQuestion}
                        >
                            <i className="fas fa-arrow-left"></i> {t("grammarExercisePage.carousel.back")}
                        </button>
                    )}
                    {currentQuestionIndex < questions.length - 1 && (
                        <button
                            className="btn_2"
                            type="button"
                            onClick={handleNextQuestion}
                            style={{ marginLeft: currentQuestionIndex === 0 ? 'auto' : '0' }}
                        >
                            <i className="fas fa-arrow-right"></i> {t("grammarExercisePage.carousel.next")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GrammarExerciseCarousel;
