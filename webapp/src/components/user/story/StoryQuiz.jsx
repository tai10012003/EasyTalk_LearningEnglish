import React, { useState } from "react";

function StoryQuiz({ quiz, onNext }) {
    const [selected, setSelected] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [hasContinued, setHasContinued] = useState(false);

    const handleAnswer = (option) => {
        setSelected(option);
        setIsAnswered(true);
    };

    const handleNextClick = () => {
        setHasContinued(true);
        onNext();
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
                                    ? "wrong"
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
                            Tiếp tục
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default StoryQuiz;