import React, { useState } from "react";

function GrammarQuiz({ quizzes, onComplete }) {
  const [answers, setAnswers] = useState(Array(quizzes.length).fill(""));
  const [checked, setChecked] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleChange = (index, value) => {
    if (checked) return;
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleCheck = () => {
    if (answers.some(a => a.trim() == "")) {
      alert("Vui lòng trả lời hết các câu hỏi trước khi kiểm tra!");
      return;
    }
    setChecked(true);
  };

  const handleFinish = () => {
    setFinished(true);
    if (onComplete) onComplete();
  };

  return (
    <div className="grammar-quiz-container">
      <h4>Bài tập ngữ pháp</h4>
      {quizzes.map((quiz, idx) => (
        <div key={idx} className="mb-4">
          <p className="grammar-quiz-question">{idx + 1}. {quiz.question}</p>

          {quiz.type == "multiple-choice" ? (
            <ul className="grammar-quiz-options">
              {quiz.options.map((opt, i) => (
                <li
                  key={i}
                  className={`grammar-quiz-option ${
                    checked
                      ? opt == quiz.correctAnswer
                        ? "correct"
                        : answers[idx] == opt
                        ? "wrong"
                        : ""
                      : answers[idx] == opt
                      ? "active"
                      : ""
                  }`}
                  onClick={() => handleChange(idx, opt)}
                >
                  {opt}
                </li>
              ))}
            </ul>
          ) : (
            <input
              type="text"
              className={`grammar-quiz-fill ${
                checked
                  ? answers[idx].trim().toLowerCase() == quiz.correctAnswer.toLowerCase()
                    ? "correct"
                    : "wrong"
                  : ""
              }`}
              value={answers[idx]}
              disabled={checked}
              onChange={(e) => handleChange(idx, e.target.value)}
            />
          )}

          {checked && quiz.explanation && (
            <div
              className={`grammar-quiz-explanation ${
                answers[idx].trim().toLowerCase() == quiz.correctAnswer.toLowerCase()
                  ? "correct"
                  : "incorrect"
              }`}
            >
              Giải thích đáp án: {quiz.explanation}
            </div>
          )}
        </div>
      ))}

      {!checked && !finished && (
        <button className="btn_1 mt_4" onClick={handleCheck}>
          <i className="fas fa-check"></i> Kiểm tra
        </button>
      )}

      {checked && !finished && (
        <button className="btn_1 mt_4" onClick={handleFinish}>
          Hoàn thành
        </button>
      )}
    </div>
  );
}

export default GrammarQuiz;
