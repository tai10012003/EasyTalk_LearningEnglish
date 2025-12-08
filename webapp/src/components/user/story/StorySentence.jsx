import React, { useState, useEffect } from "react";

function StorySentence({ sentence, onNext, onStepChange, hasStartedAudio, setHasStartedAudio }) {
    const [showVietnamese, setShowVietnamese] = useState(false);
    const [hasContinued, setHasContinued] = useState(false);
    const [canContinue, setCanContinue] = useState(false);
    const [definitions, setDefinitions] = useState({});
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);

    const en = sentence.en;
    const vi = sentence.vi;
    const vocabulary = sentence.vocabulary;
    const words = en ? en.split(" ") : [];

    useEffect(() => {
        if (!en || !("speechSynthesis" in window)) return;
        if (!hasStartedAudio) {
            return;
        }
        speechSynthesis.cancel();
        setCurrentWordIndex(-1);
        setCanContinue(false);
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
        speechSynthesis.speak(utterance);
    }, [en, hasStartedAudio]);

    const handleSpeak = () => {
        if (!en || !("speechSynthesis" in window)) return;
        if (!hasStartedAudio) {
            setHasStartedAudio(true);
            setCanContinue(false);
        }   
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
        if (onStepChange) {
            onStepChange(1, 1);
        }
    }, []);

    useEffect(() => {
        const fetchDefinitions = async () => {
            const results = {};
            await Promise.all(
                vocabulary.map(async (word) => {
                    try {
                        const res = await fetch(
                            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(word)}`
                        );
                        const data = await res.json();
                        if (data && data[0] && data[0][0] && data[0][0][0]) {
                            results[word] = data[0][0][0];
                        } else {
                            results[word] = "(Không dịch được)";
                        }
                    } catch (err) {
                        console.error("Google Translate API error:", err);
                        results[word] = "(Không dịch được)";
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
                <button className="btn-speak me-2" onClick={handleSpeak} title="Nghe lại">
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
                {!hasStartedAudio && (
                    <button className="btn_1 btn-lg" onClick={handleSpeak}>
                        🎧 Bắt đầu nghe câu chuyện
                    </button>
                )}
                {hasStartedAudio && !hasContinued && canContinue && (
                    <button className="btn_1" onClick={handleNextClick}>
                        <i className="fas fa-arrow-right ms-2"></i>Tiếp tục
                    </button>
                )}
            </div>
        </div>
    );
}

export default StorySentence;