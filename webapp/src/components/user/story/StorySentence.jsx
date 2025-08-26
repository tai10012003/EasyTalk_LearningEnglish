import React, { useState, useEffect, useRef } from "react";

function StorySentence({ sentence, onNext }) {
    const [showVietnamese, setShowVietnamese] = useState(false);
    const [hasContinued, setHasContinued] = useState(false);
    const [canContinue, setCanContinue] = useState(false);
    const [definitions, setDefinitions] = useState({});
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const firstRender = useRef(true);

    const en = sentence.en;
    const vi = sentence.vi;
    const vocabulary = sentence.vocabulary;
    const words = en ? en.split(" ") : [];

    useEffect(() => {
        if (!en || !("speechSynthesis" in window)) return;

        speechSynthesis.cancel();
        setCurrentWordIndex(-1);

        const utterance = new SpeechSynthesisUtterance(en);
        utterance.lang = "en-US";
        utterance.onboundary = (event) => {
            if (event.name == "word" || event.charIndex != undefined) {
                const charIndex = event.charIndex;
                let count = 0;
                for (let i = 0; i < words.length; i++) {
                    count += words[i].length + 1;
                    if (charIndex < count) {
                        setCurrentWordIndex(i);
                        break;
                    }
                }
            }
        };
        utterance.onend = () => {
            setCurrentWordIndex(-1);
            setCanContinue(true);
        };
        if (!firstRender.current) {
            setCanContinue(false);
        }
        speechSynthesis.speak(utterance);
        firstRender.current = false;

    }, [en]);

    const handleSpeak = () => {
        if (!en || !("speechSynthesis" in window)) return;
        speechSynthesis.cancel();
        setCurrentWordIndex(-1);
        const utterance = new SpeechSynthesisUtterance(en);
        utterance.lang = "en-US";
        utterance.onboundary = (event) => {
            if (event.name == "word" || event.charIndex !== undefined) {
                const charIndex = event.charIndex;
                let count = 0;
                for (let i = 0; i < words.length; i++) {
                    count += words[i].length + 1;
                    if (charIndex < count) {
                        setCurrentWordIndex(i);
                        break;
                    }
                }
            }
        };
        utterance.onend = () => {
            setCurrentWordIndex(-1);
            setCanContinue(true);
        };
        speechSynthesis.speak(utterance);
    };

    const handleNextClick = () => {
        setHasContinued(true);
        onNext();
    };

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

    return (
        <div className="story-sentence shadow-sm p-4 my-4">
            <div className="sentence-row d-flex align-items-center mb-2">
                <button className="btn-speak me-2" onClick={handleSpeak}>
                    🔊
                </button>
                <span
                    className="sentence-en fs-5"
                    onMouseEnter={() => setShowVietnamese(true)}
                    onMouseLeave={() => setShowVietnamese(false)}
                >
                    {words.map((word, i) => (
                        <span
                            key={i}
                            style={{
                                backgroundColor: i == currentWordIndex ? "#ffd54f" : "transparent",
                                transition: "background-color 0.2s"
                            }}
                        >
                            {word}{" "}
                        </span>
                    ))}
                </span>
            </div>

            {showVietnamese && (
                <p className="sentence-vi text-success mt-2">{vi}</p>
            )}

            {vocabulary && vocabulary.length > 0 && (
                <div className="mt-4">
                    <strong className="d-block mb-2">Từ vựng:</strong>
                    <div className="vocabulary-list d-flex flex-wrap gap-2">
                        {vocabulary.map((word, i) => (
                            <span key={i} className="vocab-item">
                                {word} : {definitions[word] || "...đang tải..."}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-4">
                {!hasContinued && canContinue && (
                    <button className="btn_1" onClick={handleNextClick}>
                        Tiếp tục
                    </button>
                )}
            </div>
        </div>
    );
}

export default StorySentence;
