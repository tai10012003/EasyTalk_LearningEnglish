import React, { useState } from "react";
import confetti from "canvas-confetti";

function StoryQuiz({ quiz, onNext }) {
    const [selected, setSelected] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [hasContinued, setHasContinued] = useState(false);

    const handleAnswer = (option) => {
        setSelected(option);
        setIsAnswered(true);
        if (option == quiz.answer) {
            // ✅ Hiệu ứng confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }
    };

    const handleNextClick = () => {
        setHasContinued(true);
        const total = 1;
        const correct = selected == quiz.answer ? 1 : 0;
        const unanswered = selected ? 0 : 1;
        onNext({ type: "quiz", correct, total, unanswered });
    };

    return (
        <div className="story-quiz shadow-lg p-4 my-4">
            <h5 className="quiz-question mb-3">{quiz.question}</h5>
            <ul className="quiz-options list-unstyled">
                {quiz.options.map((opt, idx) => (
                    <li key={idx}>
                        <button
                            className={`quiz-option ${
                                isAnswered && opt == quiz.answer
                                    ? "correct"
                                    : isAnswered && opt == selected
                                    ? "wrong shake"
                                    : ""
                            }`}
                            onClick={() => handleAnswer(opt)}
                            disabled={isAnswered}
                        >
                            {opt}
                        </button>
                    </li>
                ))}
            </ul>

            {isAnswered && (
                <div className="quiz-feedback mt-3">
                    <p
                        className={`feedback-text ${
                            selected == quiz.answer ? "correct" : "incorrect"
                        }`}
                    >
                        {selected == quiz.answer
                            ? "✅ Chính xác!"
                            : `❌ Sai rồi. Đáp án đúng: ${quiz.answer}`}
                    </p>
                    {!hasContinued && (
                        <button className="btn_1" onClick={handleNextClick}>
                            <i className="fas fa-arrow-right ms-2"></i>Tiếp tục
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default StoryQuiz;