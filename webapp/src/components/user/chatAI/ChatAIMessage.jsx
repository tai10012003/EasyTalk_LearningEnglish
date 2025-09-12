import React from "react";

function ChatAIMessage({ message, speakingWordIndex }) {
    const { sender, text } = message;

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
            <p>
                <strong>{sender == "user" ? "You" : "Chat AI"}:</strong>{" "}
                {words}
            </p>
        </div>
    );
}

export default ChatAIMessage;