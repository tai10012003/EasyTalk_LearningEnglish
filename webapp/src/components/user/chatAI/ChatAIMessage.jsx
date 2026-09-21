import React, { useState } from "react";
import user from "@/assets/images/user.png";
import AI_chat from "@/assets/images/AI_chat.png";

function ChatAIMessage({ message, speakingWordIndex }) {
    const { sender, text, suggestion, corrections } = message;
    const [showSuggestion, setShowSuggestion] = useState(false);

    const avatarSrc =
        sender == "user"
            ? user
            : AI_chat;

    const words =
        sender == "bot" && text
            ? text.split(" ").map((word, i) => (
                  <span
                      key={i}
                      className={speakingWordIndex == i ? "word-highlight" : ""}
                  >
                      {word}{" "}
                  </span>
              ))
            : text;

    return (
        <div
            className={`chat-ai-message ${
                sender == "user" ? "chat-ai-user-message" : "chat-ai-bot-message"
            }`}
        >
            <img src={avatarSrc} alt={`${sender} avatar`} />
            <div className="chat-ai-content">
                <p>
                    <strong>{sender == "user" ? "You" : "Chat AI"}:</strong>{" "}
                    {words}
                </p>
                {sender == "bot" && suggestion && (
                <div className="chat-ai-suggestion-row">
                    <button
                    className="chat-ai-suggestion-btn"
                    onClick={() => setShowSuggestion((prev) => !prev)}
                    >
                    💡
                    </button>
                    {showSuggestion && (
                    <div className="chat-ai-suggestion">
                        {suggestion}
                    </div>
                    )}
                </div>
                )}
                {sender == "bot" && Array.isArray(corrections) && corrections.length > 0 && (
                    <div className="chat-ai-corrections">
                        <button
                            className="chat-ai-suggestion-btn"
                            onClick={() => setShowSuggestion((prev) => !prev)}
                        >
                            <i className="fas fa-check"></i>
                        </button>
                        {showSuggestion && (
                            <div className="chat-ai-suggestion">
                                {corrections.map((correction, index) => (
                                    <div key={index} className="chat-ai-correction-item">
                                        <strong>{correction.corrected}</strong>
                                        {correction.explanation && <span> - {correction.explanation}</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default ChatAIMessage;
