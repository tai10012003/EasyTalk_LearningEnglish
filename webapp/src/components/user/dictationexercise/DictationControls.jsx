import React, { useEffect, useState } from "react";

function DictationControls({
    playSentence,
    playSpeed,
    updateSpeed,
    userInput,
    setUserInput,
    checkDictation,
    skipSentence,
    nextSentence,
    result,
    currentSentenceDisplay,
    showNext,
}) {
    const [skipTimer, setSkipTimer] = useState(20);
    const [canSkip, setCanSkip] = useState(false);

    useEffect(() => {
        if (!result && !showNext) {
            setSkipTimer(20);
            setCanSkip(false);
        }
        if (!showNext && !canSkip) {
            const countdown = setInterval(() => {
                setSkipTimer((prev) => {
                    if (prev <= 1) {
                        clearInterval(countdown);
                        setCanSkip(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(countdown);
        }
    }, [result, showNext, canSkip]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.code === "Space") {
                e.preventDefault();
                playSentence();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [playSentence]);

    const handleKeyDownInTextarea = (e) => {
        if (e.key == "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (showNext) {
                nextSentence();
            } else {
                checkDictation();
            }
        }
    };

    return (
        <div className="dictation-controls">
            <div>
                <button 
                    id="dictation-audio" 
                    onClick={() => playSentence()}
                    title="Bấm Ctrl + Space để phát lại câu"
                >
                    <i className="fas fa-volume-up"></i>
                </button>

                <label
                    htmlFor="dictation-speedControl"
                    className="dictation-speed-label"
                >
                    Tốc độ âm thanh:
                </label>
                <input
                    type="range"
                    id="dictation-speedControl"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={playSpeed}
                    onChange={updateSpeed}
                />
                <span id="dictation-speedDisplay">{playSpeed}x</span>
            </div>
            <textarea
                className="dictation-textarea"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDownInTextarea}
                placeholder="Nhập lại nội dung bạn nghe được..."
                rows="3"
            />
            {!result ? (
                <div id="dictation-currentSentenceDisplay">{currentSentenceDisplay}</div>
            ) : (
                <div id="dictation-result">{result}</div>
            )}
            {!showNext ? (
                <>
                    <button id="dictation-checkButton" onClick={checkDictation}>
                        Kiểm tra
                    </button>
                    <button id="dictation-skipButton" onClick={skipSentence} disabled={!canSkip}
                        style={{
                            opacity: canSkip ? 1 : 0.5,
                            cursor: canSkip ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {canSkip ? 'Bỏ qua' : `Bỏ qua (${skipTimer}s)`}
                    </button>
                </>
            ) : (
                <button id="dictation-nextButton" onClick={nextSentence}>
                    Tiếp theo
                </button>
            )}
        </div>
    );
}

export default DictationControls;