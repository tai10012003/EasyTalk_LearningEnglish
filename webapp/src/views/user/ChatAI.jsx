import React, { useState, useEffect } from "react";
import ChatAIMessage from "../../components/user/chatAI/ChatAIMessage";
import ChatAIInput from "../../components/user/chatAI/ChatAIInput";
import { ChatAIService } from "../../services/ChatAIService";

function ChatAI() {
    const [messages, setMessages] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [sessionTopic, setSessionTopic] = useState(null);
    const [step, setStep] = useState("ask_name");
    const [lastBotText, setLastBotText] = useState("");
    const [speakingWordIndex, setSpeakingWordIndex] = useState(null);
    const [isFirstMessage, setIsFirstMessage] = useState(true);

    useEffect(() => {
        const startConversation = async () => {
            try {
                const data = await ChatAIService.startConversation();
                setMessages([{ sender: "bot", text: data.response, suggestion: data.suggestion }]);
                setStep(data.step);
                setLastBotText(data.response);
                speakText(data.response);
                setIsFirstMessage(false);
            } catch (err) {
                console.error("Error starting conversation:", err);
            }
        };
        startConversation();
    }, []);

    useEffect(() => {
        if (lastBotText && !isFirstMessage) {
            speakText(lastBotText);
        }
    }, [lastBotText]);

    useEffect(() => {
        const chatBox = document.getElementById("chat-ai-box");
        if (chatBox) {
            chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: "smooth" });
        }
    }, [messages]);

    const speakText = (text) => {
        if (!window.speechSynthesis) return;
        let cleanText = text.replace(/<[^>]+>/g, "");
        cleanText = cleanText.replace(
            /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDDFF])/g,
            ""
        );
        const utterance = new SpeechSynthesisUtterance(cleanText.trim());
        utterance.lang = "en-US";
        utterance.rate = 1;
        utterance.pitch = 1;

        const words = cleanText.trim().split(" ");
        utterance.onboundary = (event) => {
            if (event.name == "word" || event.name == "text") {
                let charIndex = event.charIndex;
                let count = 0;
                for (let i = 0; i < words.length; i++) {
                    count += words[i].length + 1;
                    if (charIndex < count) {
                        setSpeakingWordIndex(i);
                        break;
                    }
                }
            }
        };

        utterance.onend = () => {
            setSpeakingWordIndex(null);
        };
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    };

    const handleSendMessage = async (text) => {
        if (isSending) return alert("Đang gửi tin nhắn, vui lòng đợi...");
        setIsSending(true);
        setMessages((prev) => [...prev, { sender: "user", text }]);
        try {
            const data = await ChatAIService.sendMessage(text, sessionTopic, step);
            if (!sessionTopic) setSessionTopic(data.topic);
            if (data.step) setStep(data.step);

            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: data.response || "...", suggestion: data.suggestion }
            ]);
            setLastBotText(data.response || "...");
        } catch (error) {
            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: "Không thể gửi tin nhắn. Vui lòng thử lại." },
            ]);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="container chat-ai-container">
            <div className="chat-ai-header text-center">
                <h3>Trò Chuyện Với AI - Thực Hành Tiếng Anh</h3>
            </div>
            <div id="chat-ai-box" className="chat-ai-box">
                {messages.map((msg, idx) => (
                    <ChatAIMessage
                        key={idx}
                        message={msg}
                        speakingWordIndex={
                            msg.sender == "bot" && idx == messages.length - 1
                                ? speakingWordIndex
                                : null
                        }
                    />
                ))}
            </div>
            <ChatAIInput onSend={handleSendMessage} disabled={isSending} />
        </div>
    );
}

export default ChatAI;