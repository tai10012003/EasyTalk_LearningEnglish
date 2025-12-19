import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

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
    repeatCount,
    setRepeatCount,
    currentSentence,
}) {
    const [skipTimer, setSkipTimer] = useState(20);
    const [canSkip, setCanSkip] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [hotkey, setHotkey] = useState("Ctrl+Space");
    const [tempRepeatCount, setTempRepeatCount] = useState(repeatCount);
    const [tempHotkey, setTempHotkey] = useState(hotkey);
    const [vietnameseTranslation, setVietnameseTranslation] = useState("");
    const [wordDefinitions, setWordDefinitions] = useState({});
    const [hoveredWord, setHoveredWord] = useState(null);

    useEffect(() => {
        if (showSettingsModal) {
            setTempRepeatCount(repeatCount);
            setTempHotkey(hotkey);
        }
    }, [showSettingsModal, repeatCount, hotkey]);

    useEffect(() => {
        if (!result && !showNext) {
            setSkipTimer(20);
            setCanSkip(false);
        }
    }, [result, showNext]);

    useEffect(() => {
        if (!showNext) {
            const countdown = setInterval(() => {
                setSkipTimer((prev) => {
                    if (prev <= 1) {
                        setCanSkip(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(countdown);
        }
    }, [showNext]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (hotkey === "Ctrl+Space" && e.ctrlKey && e.code === "Space") {
                e.preventDefault();
                playSentence(1);
            } else if (hotkey === "Ctrl+P" && e.ctrlKey && e.key === "p") {
                e.preventDefault();
                playSentence(1);
            } else if (hotkey === "Ctrl+L" && e.ctrlKey && e.key === "l") {
                e.preventDefault();
                playSentence(1);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [playSentence, hotkey]);

    useEffect(() => {
        if (showNext && currentSentence) {
            fetchVietnameseTranslation(currentSentence);
        }
    }, [showNext, currentSentence]);

    const fetchVietnameseTranslation = async (sentence) => {
        if (!sentence || sentence.trim() === "") {
            setVietnameseTranslation("Không có nội dung để dịch");
            return;
        }
        try {
            let cleanedSentence = sentence.replace(/\?/g, "? ").replace(/\!/g, "! ").replace(/\./g, ". ").replace(/\,/g, ", ").replace(/\;/g, "; ").replace(/\:/g, ": ").replace(/\s+/g, " ").trim();
            if (cleanedSentence.length > 400) {
                cleanedSentence = cleanedSentence.substring(0, 400) + "...";
            }
            const response = await fetch(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(cleanedSentence)}`
            );
            if (!response.ok) {
                throw new Error("Translation API error");
            }
            const data = await response.json();
            if (data && data[0] && data[0][0] && data[0][0][0]) {
                const translatedText = data[0].map(item => item[0]).join("").trim();
                setVietnameseTranslation(translatedText || "Không thể dịch câu này");
            } else {
                setVietnameseTranslation("Không thể dịch câu này");
            }
        } catch (error) {
            console.error("Error fetching translation:", error);
            setVietnameseTranslation("Lỗi dịch (kiểm tra kết nối mạng)");
        }
    };

    const fetchWordDefinition = async (word) => {
        if (wordDefinitions[word]) return;
        try {
            const response = await fetch(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
            );
            const data = await response.json();
            if (data && data[0] && data[0].meanings && data[0].meanings[0]) {
                const meaning = data[0].meanings[0];
                const definition = meaning.definitions[0].definition;
                const partOfSpeech = meaning.partOfSpeech;
                setWordDefinitions(prev => ({
                    ...prev,
                    [word]: {
                        definition,
                        partOfSpeech,
                        phonetic: data[0].phonetic || ""
                    }
                }));
            }
        } catch (error) {
            console.error("Error fetching word definition:", error);
        }
    };

    const handleWordHover = (word) => {
        const cleanWord = word.replace(/[.,!?;:]/g, "").toLowerCase();
        setHoveredWord(cleanWord);
        fetchWordDefinition(cleanWord);
    };

    const handleKeyDownInTextarea = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (showNext) {
                nextSentence();
            } else {
                checkDictation();
            }
        }
    };

    const saveSettings = () => {
        setRepeatCount(tempRepeatCount);
        setHotkey(tempHotkey);
        setShowSettingsModal(false);
        Swal.fire({
            icon: "success",
            title: "Lưu thành công!",
            text: "Cài đặt của bạn đã được áp dụng.",
            confirmButtonText: "OK",
            timer: 2000
        });
    };

    const renderSentenceWithTooltips = () => {
        if (!currentSentence) return null;
        const words = currentSentence.split(" ");
        return (
            <div className="dictation-sentence-words">
                {words.map((word, index) => {
                    const cleanWord = word.replace(/[.,!?;:]/g, "").toLowerCase();
                    const definition = wordDefinitions[cleanWord];
                    return (
                        <span
                            key={index}
                            className="dictation-word"
                            onMouseEnter={() => handleWordHover(word)}
                            onMouseLeave={() => setHoveredWord(null)}
                        >
                            {word}
                            {hoveredWord === cleanWord && definition && (
                                <div className="dictation-word-tooltip">
                                    <div className="dictation-tooltip-word">
                                        {cleanWord} {definition.phonetic && `(${definition.phonetic})`}
                                    </div>
                                    <div className="dictation-tooltip-pos">
                                        {definition.partOfSpeech}
                                    </div>
                                    <div className="dictation-tooltip-definition">
                                        {definition.definition}
                                    </div>
                                </div>
                            )}
                        </span>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="dictation-controls">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button 
                        id="dictation-audio" 
                        onClick={() => playSentence(1)}
                        title={`Bấm ${hotkey} để phát lại câu`}
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
                <button 
                    id="dictation-settings-button"
                    onClick={() => setShowSettingsModal(true)}
                    title="Cài đặt"
                >
                    <i className="fas fa-cog"></i>
                </button>
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
            {showNext && currentSentence && (
                <div className="dictation-meaning-card">
                    <div className="dictation-card-title">
                        <i className="fas fa-book"></i> Nghĩa của câu
                    </div>
                    <div className="dictation-card-content">
                        <div className="dictation-english-sentence">
                            {renderSentenceWithTooltips()}
                        </div>
                        <div className="dictation-vietnamese-translation">
                            <i className="fas fa-language"></i> {vietnameseTranslation || "Đang dịch..."}
                        </div>
                    </div>
                </div>
            )}
            {!showNext ? (
                <>
                    <button id="dictation-checkButton" onClick={checkDictation}>
                        <i className="fas fa-check me-2"></i> Kiểm tra
                    </button>
                    <button id="dictation-skipButton" onClick={skipSentence} disabled={!canSkip}
                        style={{
                            opacity: canSkip ? 1 : 0.5,
                            cursor: canSkip ? 'pointer' : 'not-allowed'
                        }}
                    >
                        <i className="fa-solid fa-forward-step"></i>
                        {canSkip ? 'Bỏ qua' : `Bỏ qua (${skipTimer}s)`}
                    </button>
                </>
            ) : (
                <button id="dictation-nextButton" onClick={nextSentence}>
                    <i className="fas fa-arrow-right"></i> Tiếp theo
                </button>
            )}
            {showSettingsModal && (
                <div className="dictation-modal-overlay" onClick={() => setShowSettingsModal(false)}>
                    <div className="dictation-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="dictation-modal-header">
                            <h3>Cài đặt</h3>
                            <button 
                                className="dictation-modal-close"
                                onClick={() => setShowSettingsModal(false)}
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="dictation-modal-body">
                            <div className="dictation-setting-item">
                                <label htmlFor="dictation-repeat-select">
                                    Số lần phát sau khi qua câu mới:
                                </label>
                                <select 
                                    id="dictation-repeat-select"
                                    value={tempRepeatCount}
                                    onChange={(e) => setTempRepeatCount(Number(e.target.value))}
                                >
                                    <option value={1}>1 lần</option>
                                    <option value={2}>2 lần</option>
                                    <option value={3}>3 lần</option>
                                    <option value={4}>4 lần</option>
                                    <option value={5}>5 lần</option>
                                </select>
                            </div>
                            <div className="dictation-setting-item">
                                <label htmlFor="dictation-hotkey-select">
                                    Phím tắt phát lại:
                                </label>
                                <select 
                                    id="dictation-hotkey-select"
                                    value={tempHotkey}
                                    onChange={(e) => setTempHotkey(e.target.value)}
                                >
                                    <option value="Ctrl+Space">Ctrl + Space</option>
                                    <option value="Ctrl+P">Ctrl + P</option>
                                    <option value="Ctrl+L">Ctrl + L</option>
                                </select>
                            </div>
                        </div>
                        <div className="dictation-modal-footer">
                            <button 
                                className="dictation-modal-save"
                                onClick={saveSettings}
                            >
                                Lưu cài đặt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DictationControls;