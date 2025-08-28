import React, { useState, useMemo, useEffect } from "react";

const FlashCardReviewCard = ({ card, mode, onCheckAnswer, allWords = [] }) => {
    const [flipped, setFlipped] = useState(false);
    const [userAnswer, setUserAnswer] = useState("");
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        setSelected(null);
        setUserAnswer("");
        setFlipped(false);
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
        onCheckAnswer(userAnswer.trim(), card.word);
    };

    const mcQuestion = useMemo(() => {
        if (!card || !card.word || !card.exampleSentence) return null;
        const question = card.exampleSentence.replace(
        new RegExp(`\\b${card.word}\\b`, "gi"),
        "______"
        );
        const correctAnswer = card.word;
        let wrongAnswers = allWords.filter((w) => w !== card.word);
        wrongAnswers = wrongAnswers.sort(() => 0.5 - Math.random()).slice(0, 3);
        const choices = [correctAnswer, ...wrongAnswers].sort(() => 0.5 - Math.random());

        return { question, choices, correctAnswer };
    }, [card, allWords]);

    const handleChoiceClick = (choice) => {
        if (selected || !mcQuestion) return;
        setSelected(choice);
        onCheckAnswer(choice, mcQuestion.correctAnswer);
    };

    if (mode == "flip") {
        return (
        <div className={`flashcard-review-card ${flipped ? "is-flipped" : ""}`} onClick={handleFlip}>
            <div className="flashcard-review-inner">
            <div className="flashcard-review-front">
                <h3>{card.word}</h3>
                <p className="pronunciation">({card.pos}) {card.pronunciation}</p>
            </div>
            <div className="flashcard-review-back">
                <p><strong>Định nghĩa:</strong> {card.meaning}</p>
                <p><strong>Ví dụ:</strong> {card.exampleSentence}</p>
                {card.image && <img src={`data:image/jpeg;base64,${card.image}`} alt={card.word} />}
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
                    <strong>Chọn đáp án đúng:</strong> {question}
                </p>
                <div className="choices">
                    {choices.map((choice, i) => {
                    let btnClass = "choice-btn";
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
            <p><strong>Điền từ vào chỗ trống:</strong> {card.exampleSentence.replace(card.word, "______")}</p>
            <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Nhập từ"
            />
            <button onClick={handleCheckFill}>Kiểm tra</button>
        </div>
        );
    }

    return null;
};

export default FlashCardReviewCard;
