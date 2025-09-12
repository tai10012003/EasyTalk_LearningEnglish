import React, { useState, useRef } from "react";

function ChatAIInput({ onSend, disabled }) {
    const [input, setInput] = useState("");
    const [mode, setMode] = useState("text")
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return alert("Vui lòng nhập nội dung tin nhắn.");
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
            alert("Trình duyệt không hỗ trợ voice recognition.");
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
                {mode == "text" ? "Giao tiếp" : "Nhắn tin"}
            </button>

            {mode == "text" ? (
                <>
                    <input
                        type="text"
                        className="chat-ai-input"
                        placeholder="Nhập tin nhắn của bạn ..."
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