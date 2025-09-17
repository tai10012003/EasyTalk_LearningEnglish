import React from "react";

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
    return (
        <div className="dictation-controls">
            <div>
                <button id="dictation-audio" onClick={() => playSentence()}>
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
                    <button id="dictation-skipButton" onClick={skipSentence}>
                        Bỏ qua
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