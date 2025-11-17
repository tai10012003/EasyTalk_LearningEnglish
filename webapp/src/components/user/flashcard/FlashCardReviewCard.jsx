import React, { useState, useMemo, useEffect, useRef } from "react";
import Swal from "sweetalert2";

const FlashCardReviewCard = ({ card, mode, onCheckAnswer, allWords = [] }) => {
    const [flipped, setFlipped] = useState(false);
    const mcQuestionRef = useRef(null);
    const [userAnswer, setUserAnswer] = useState("");
    const [status, setStatus] = useState(null);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState(""); 

    useEffect(() => {
        setSelected(null);
        setUserAnswer("");
        setFlipped(false);
        setStatus(null);
        setError("");
    }, [card, mode]);

    useEffect(() => {
        if (mode == "flip" && card?.word) {
            if ("speechSynthesis" in window) {
                const utterance = new SpeechSynthesisUtterance(card.word);
                utterance.lang = "en-US";
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(utterance);
            }
        }
    }, [mode, card]);

    const handleFlip = () => {
        if (mode == "flip") setFlipped(!flipped);
    };

    const handleCheckFill = () => {
        const answer = userAnswer.trim();
        if (!answer) {
            Swal.fire({
                icon: "warning",
                title: "Thiếu câu trả lời!",
                text: "Vui lòng nhập từ trước khi kiểm tra.",
                confirmButtonText: "OK",
            });
            return;
        }
        if (answer.toLowerCase() == card.word.toLowerCase()) {
            setStatus("correct");
        } else {
            setStatus("wrong");
        }
        onCheckAnswer(answer, card.word);
    };

    const handleShowAnswer = () => {
        setUserAnswer(card.word);
        setStatus("show");
    };

    const mcQuestion = useMemo(() => {
        if (!card || !allWords.length) return null;
        if (mcQuestionRef.current && mcQuestionRef.current.cardId == card._id) {
            return mcQuestionRef.current.data;
        }
        const wordPattern = new RegExp(`\\b${card.word}(s|d|ed|ing)?\\b`, "gi");
        const question = card.exampleSentence.replace(wordPattern, "______");
        const correctAnswer = card.word;
        const distractors = allWords.filter(w => w !== card.word).sort(() => 0.5 - Math.random()).slice(0, 3);
        if (distractors.length < 3) return null;
        const allChoices = [correctAnswer, ...distractors];
        const shuffled = [...allChoices].sort(() => 0.5 - Math.random());
        const result = { question, choices: shuffled, correctAnswer };
        mcQuestionRef.current = { cardId: card._id, data: result };
        return result;
    }, [card, allWords]);

    const handleChoiceClick = (choice) => {
        if (selected || !mcQuestion) return;
        setSelected(choice);
        onCheckAnswer(choice, mcQuestion.correctAnswer);
    };

    if (mode == "flip") {
        return (
            <div
                className={`flashcard-review-card ${flipped ? "is-flipped" : ""}`}
                onClick={handleFlip}
            >
                <div className="flashcard-review-inner">
                    <div className="flashcard-review-front">
                        <h3>{card.word}</h3>
                        <p className="pronunciation">
                            ({card.pos}) {card.pronunciation}
                        </p>
                    </div>
                    <div className="flashcard-review-back">
                        <p>
                            <strong>Định nghĩa:</strong> {card.meaning}
                        </p>
                        <p>
                            <strong>Ví dụ:</strong> {card.exampleSentence}
                        </p>
                        {card.image && (
                            <img
                                src={card.image}
                                alt={card.word}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    }
    if (mode == "choice" && mcQuestion) {
        const { question, choices, correctAnswer } = mcQuestion;
        return (
            <div className="flashcard-review-mc">
                <p>
                    <strong>Định nghĩa:</strong> ({card.pos}) {card.meaning}
                </p>
                <p>
                    <strong>Chọn đáp án đúng cho câu ví dụ sau:</strong> {question}
                </p>
                <div className="flashcard-review-choices">
                    {choices.map((choice, i) => {
                        let btnClass = "flashcard-review-choice-btn";
                        if (selected) {
                            if (choice == correctAnswer) btnClass += " correct";
                            else if (choice == selected) btnClass += " wrong";
                        }
                        return (
                            <button
                                key={i}
                                className={btnClass}
                                onClick={() => handleChoiceClick(choice)}
                                disabled={!!selected}
                            >
                                {choice}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }
    if (mode == "fill") {
        return (
            <div className="flashcard-review-fill">
                <p>
                    <strong>Định nghĩa:</strong> ({card.pos}) {card.meaning}
                </p>
                <p>
                    <strong>Điền từ cho câu ví dụ sau:</strong>{" "}
                    {card.exampleSentence.replace(card.word, "______")}
                </p>
                <input
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Nhập từ"
                    disabled={status == "show"}
                    className={
                        status == "correct"
                            ? "flashcard-review-input-correct"
                            : status == "wrong"
                            ? "flashcard-review-input-wrong"
                            : status == "show"
                            ? "flashcard-review-input-show"
                            : ""
                    }
                />
                {status == "wrong" && (
                    <p className="flashcard-correct-answer" style={{ marginTop: "20px" }}>
                        ✅ Đáp án đúng là: <strong>{card.word}</strong>
                    </p>
                )}
                {status == null && (
                    <div style={{ marginTop: "30px" }}>
                        <button
                            onClick={handleShowAnswer}
                            style={{ marginRight: "30px" }}
                        >
                            <i className="fas fa-eye"></i>Hiện đáp án
                        </button>
                        <button onClick={handleCheckFill}><i className="fas fa-check"></i>Kiểm tra</button>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export default FlashCardReviewCard;