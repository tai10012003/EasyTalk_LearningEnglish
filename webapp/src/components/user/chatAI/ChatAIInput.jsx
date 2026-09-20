import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";

function ChatAIInput({ onSend, disabled }) {
    const { t } = useTranslation();
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("text")
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return Swal.fire({
            icon: "warning",
            title: t("chatAIPage.alert.warningTitle"),
            text: t("chatAIPage.input.emptyMessage")
        });
        onSend(trimmed);
        setInput("");
    };

    const handleKeyPress = (e) => {
        if (e.key == "Enter") handleSend();
    };

    const toggleMode = () => {
        setMode(mode == "text" ? "voice" : "text");
        stopListening();
    };

    const startListening = () => {
        if (!("webkitSpeechRecognition" in window)) {
            Swal.fire({
                icon: "error",
                title: t("chatAIPage.alert.errorTitle"),
                text: t("chatAIPage.input.speechUnsupported")
            });
            return;
        }
        const recognition = new window.webkitSpeechRecognition();
        recognition.lang = "en-US";
        recognition.interimResults = false;
        recognition.continuous = false;

        recognition.onstart = () => setListening(true);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            onSend(transcript);
        };
        recognition.onerror = (err) => {
            console.error("Recognition error:", err);
            setListening(false);
        };
        recognition.onend = () => setListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        setListening(false);
    };

    return (
        <div className="chat-ai-input-area">
            <button
                className="chat-ai-mode-btn"
                onClick={toggleMode}
                disabled={disabled}
            >
                {mode == "text" ? t("chatAIPage.input.voiceMode") : t("chatAIPage.input.textMode")}
            </button>

            {mode == "text" ? (
                <>
                    <input
                        type="text"
                        className="chat-ai-input"
                        placeholder={t("chatAIPage.input.placeholder")}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={disabled}
                    />
                    <button
                        className="chat-ai-send-btn"
                        onClick={handleSend}
                        disabled={disabled}
                    >
                        <i className="fa fa-paper-plane"></i>
                    </button>
                </>
            ) : (
                <button
                    className={`chat-ai-mic-btn ${listening ? "listening" : ""}`}
                    onClick={listening ? stopListening : startListening}
                    disabled={disabled}
                >
                    <i className="fa fa-microphone"></i>
                </button>
            )}
        </div>
    );
}

export default ChatAIInput;
