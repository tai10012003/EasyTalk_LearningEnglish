import React, { useState, useEffect, useRef, useContext } from "react";
import { UNSAFE_NavigationContext } from "react-router-dom";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import ChatAIMessage from "@/components/user/chatAI/ChatAIMessage.jsx";
import ChatAIInput from "@/components/user/chatAI/ChatAIInput.jsx";
import { ChatAIService } from "@/services/ChatAIService.jsx";
import Swal from "sweetalert2";

function ChatAI() {
    const [messages, setMessages] = useState([]);
    const [isSending, setIsSending] = useState(false);
    const [sessionTopic, setSessionTopic] = useState(null);
    const [step, setStep] = useState("ask_name");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [lastBotText, setLastBotText] = useState("");
    const [speakingWordIndex, setSpeakingWordIndex] = useState(null);
    const [isFirstMessage, setIsFirstMessage] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const hasStarted = messages.length > 0;
    const allowNavigationRef = useRef(false);
    const { navigator } = useContext(UNSAFE_NavigationContext);

    useEffect(() => {
        document.title = "Giao tiếp với AI - EasyTalk";
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
            } finally {
                setIsLoading(false);
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

    useEffect(() => {
        if (!navigator || !hasStarted) return;
        const originalPush = navigator.push;
        const originalReplace = navigator.replace;
        const handleNavigation = async (originalMethod, args) => {
            if (!allowNavigationRef.current && hasStarted) {
                const result = await Swal.fire({
                    icon: "warning",
                    title: "Cảnh báo",
                    text: "Bạn đang trong cuộc hội thoại với AI. Nếu rời đi, nội dung sẽ không được lưu. Bạn có chắc muốn rời đi?",
                    showCancelButton: true,
                    confirmButtonText: "Rời đi",
                    cancelButtonText: "Ở lại",
                    confirmButtonColor: "#d33",
                    cancelButtonColor: "#3085d6",
                });
                if (result.isConfirmed) {
                    allowNavigationRef.current = true;
                    originalMethod.apply(navigator, args);
                }
            } else {
                originalMethod.apply(navigator, args);
            }
        };
        navigator.push = (...args) => handleNavigation(originalPush, args);
        navigator.replace = (...args) => handleNavigation(originalReplace, args);
        return () => {
            navigator.push = originalPush;
            navigator.replace = originalReplace;
        };
    }, [navigator, hasStarted]);

    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasStarted) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [hasStarted]);

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
        if (isSending)
            return Swal.fire({
                icon: "warning",
                title: "Cảnh báo",
                text: "Đang gửi tin nhắn, vui lòng đợi...",
            });
        setIsSending(true);
        setMessages((prev) => [...prev, { sender: "user", text }]);
        try {
            const data = await ChatAIService.sendMessage(text, sessionTopic, step);
            if (!sessionTopic) setSessionTopic(data.topic);
            if (data.step) setStep(data.step);

            setMessages((prev) => [
                ...prev,
                { sender: "bot", text: data.response || "...", suggestion: data.suggestion },
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

    if (isLoading) return <LoadingScreen />;

    return (
        <>
            <div className="container chat-ai-container">
                <div className="chat-ai-header text-center">
                    <h3>Giao Tiếp Với AI - Thực Hành Tiếng Anh
                        <i
                            className="fas fa-question-circle help-icon"
                            style={{ cursor: "pointer" }}
                            onClick={() => setIsModalOpen(true)}
                        ></i>
                    </h3>
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
            {isModalOpen && (
                <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5>Hướng Dẫn Luyện Giao Tiếp Với AI</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>Chào mừng bạn đến với chức năng <strong>Giao tiếp với AI</strong>. Tại đây, bạn có thể luyện tập nói tiếng Anh trực tiếp với AI.</p>
                            <p>
                                <strong>Các bước thực hiện:</strong>
                            </p>
                            <ul>
                                <li><strong>Trò chuyện:</strong> Nhập câu hỏi hoặc phản hồi của bạn vào ô chat và nhấn gửi.</li>
                                <li><strong>Phản hồi từ AI:</strong> AI sẽ trả lời bạn bằng tiếng Anh, giúp bạn luyện tập phản xạ và ngữ pháp.</li>
                                <li><strong>Nghe phát âm:</strong> AI sẽ đọc to câu trả lời, bạn có thể theo dõi từ nào đang được phát âm.</li>
                                <li><strong>Đánh dấu từ:</strong> Các từ AI đang phát âm sẽ được đánh dấu, giúp bạn dễ theo dõi và luyện phát âm.</li>
                                <li><strong>Tiếp tục hội thoại:</strong> Nhập thêm câu hỏi hoặc phản hồi để AI tiếp tục trò chuyện cùng bạn.</li>
                            </ul>
                            <p><strong>Lưu ý:</strong></p>
                            <ul>
                                <li>Nghe kỹ câu trả lời và cố gắng nhại theo để cải thiện phát âm.</li>
                                <li>Đừng ngần ngại thử các câu hỏi khác nhau để nâng cao kỹ năng giao tiếp.</li>
                            </ul>
                            <p>🎉 Chúc bạn luyện tập giao tiếp hiệu quả và tự tin hơn mỗi ngày!</p>
                        </div>
                        <div className="custom-modal-footer">
                            <button className="footer-btn" onClick={() => setIsModalOpen(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ChatAI;