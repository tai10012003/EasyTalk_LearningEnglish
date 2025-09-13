import React, { useState } from "react";

function ChatAIMessage({ message, speakingWordIndex }) {
    const { sender, text, suggestion } = message;
    const [showSuggestion, setShowSuggestion] = useState(false);

    const avatarSrc =
        sender == "user"
            ? "/src/assets/images/user.png"
            : "/src/assets/images/AI_chat.png";

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
            </div>
        </div>
    );
}

export default ChatAIMessage;