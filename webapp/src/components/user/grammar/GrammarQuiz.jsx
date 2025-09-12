import React, { useState } from "react";

function GrammarQuiz({ quizzes, onComplete }) {
  // Hàm shuffle chuẩn Fisher–Yates
  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  const [shuffledQuizzes] = useState(() => shuffleArray(quizzes));
  const [answers, setAnswers] = useState(Array(shuffledQuizzes.length).fill(""));
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

  const normalizeString = (str) => {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  return (
    <div className="lesson-quiz-container">
      <h4>Bài tập ngữ pháp</h4>
      {shuffledQuizzes.map((quiz, idx) => (
        <div key={idx} className="mb-4">
          <p className="lesson-quiz-question">{idx + 1}. {quiz.question}</p>

          {quiz.type == "multiple-choice" ? (
            <ul className="lesson-quiz-options">
              {quiz.options.map((opt, i) => (
                <li
                  key={i}
                  className={`lesson-quiz-option ${
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
              className={`lesson-quiz-fill ${
                checked
                ? normalizeString(answers[idx]) == normalizeString(quiz.correctAnswer)
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
              className={`lesson-quiz-explanation ${
                normalizeString(answers[idx]) == normalizeString(quiz.correctAnswer)
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
