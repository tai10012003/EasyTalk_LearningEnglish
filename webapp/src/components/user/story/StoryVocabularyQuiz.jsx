import React, { useEffect, useState } from "react";

function StoryVocabularyQuiz({ vocabulary, onNext }) {
    const [answers, setAnswers] = useState({});
    const [showResult, setShowResult] = useState(false);
    const [options, setOptions] = useState({});
    const [definitions, setDefinitions] = useState({});
    const [hasContinued, setHasContinued] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);

    useEffect(() => {
        const fetchDefinitions = async () => {
            const results = {};
            await Promise.all(
                vocabulary.map(async (word) => {
                    try {
                        const res = await fetch(
                            `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
                        );
                        const data = await res.json();
                        if (Array.isArray(data) && data[0]?.meanings?.length > 0) {
                            results[word] = data[0].meanings[0].definitions[0].definition;
                        } else {
                            results[word] = "(Không tìm được nghĩa)";
                        }
                    } catch (err) {
                        console.error("Dictionary API error:", err);
                        results[word] = "(Không tìm được nghĩa)";
                    }
                })
            );
            setDefinitions(results);
        };

        if (vocabulary && vocabulary.length > 0) {
            fetchDefinitions();
        }
    }, [vocabulary]);

    useEffect(() => {
        if (!vocabulary || Object.keys(definitions).length == 0) return;

        const newOptions = {};
        vocabulary.forEach((word) => {
            const correct = definitions[word];
            const wrongs = Object.values(definitions)
                .filter(v => v !== correct)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
            newOptions[word] = [correct, ...wrongs].sort(() => 0.5 - Math.random());
        });
        setOptions(newOptions);
    }, [definitions, vocabulary]);

    const handleSelect = (word, choice) => {
        setAnswers(prev => ({ ...prev, [word]: choice }));
    };

    const handleSubmit = () => setShowResult(true);
    const handleContinue = () => {
        setHasContinued(true);
        setQuizCompleted(true);
        setShowResult(false); 
        onNext();
    };

    return (
        <div className="vocab-quiz">
            <h5>Chọn nghĩa đúng cho từ vựng:</h5>
            {vocabulary.map((word, idx) => (
                <div key={idx} className="vocab-word">
                    <strong>{idx + 1}. {word}</strong>
                    <div className="vocab-options">
                        {options[word]?.map((opt, i) => {
                            let className = "";
                            if (showResult || quizCompleted) {
                                if (opt === definitions[word]) className = "correct";
                                else if (!answers[word]) className = "unselected";
                                else if (answers[word] === opt && opt !== definitions[word]) className = "wrong";
                            } else if (answers[word] === opt) className = "selected";
                            return (
                                <button
                                    key={i}
                                    className={className}
                                    disabled={showResult || quizCompleted}
                                    onClick={() => handleSelect(word, opt)}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {!hasContinued && (
                !showResult ? (
                    <button
                        className="btn_1 mt-4"
                        onClick={handleSubmit}
                        disabled={Object.keys(options).length == 0}
                    >
                        Kiểm tra
                    </button>
                ) : (
                    <button className="btn_1 mt-4" onClick={handleContinue}>
                        Tiếp tục
                    </button>
                )
            )}
        </div>
    );
}

export default StoryVocabularyQuiz;