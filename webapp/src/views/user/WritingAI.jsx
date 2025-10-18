import React, { useState, useEffect } from "react";
import { WritingAIService } from "@/services/WritingAIService.jsx";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import WritingAIInput from "@/components/user/writingAI/WritingAIInput.jsx";
import WritingAIResult from "@/components/user/writingAI/WritingAIResult.jsx";

function WritingAI() {
    const [topic, setTopic] = useState("");
    const [userText, setUserText] = useState("");
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = "Luyện viết với AI - EasyTalk";
        fetchTopic();
    }, []);

    const fetchTopic = async () => {
        setIsLoading(true);
        try {
            const generatedTopic = await WritingAIService.getRandomTopic();
            setTopic(generatedTopic);
        } catch (err) {
            console.error("Error fetching topic:", err);
            setTopic("Không thể lấy đề bài. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        const trimmedText = userText.trim();
        if (!trimmedText) return alert("Vui lòng viết bài trước khi nộp bài !!");
        if (trimmedText.length < 200) {
            return alert("Bài viết của bạn phải ít nhất 200 ký tự mới được phép nộp bài !!");
        }
        setIsSubmitting(true);
        try {
            const result = await WritingAIService.analyzeWriting(trimmedText);
            setAnalysisResult(result);
        } catch (err) {
            console.error("Error analyzing writing:", err);
            alert("Không thể phân tích bài viết. Vui lòng thử lại.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = async () => {
        setUserText("");
        setAnalysisResult(null);
        fetchTopic();
    };

    if (isLoading) return <LoadingScreen />;

    return (
        <>
            <div className="container writingai-container">
                <div className="writingai-header text-center mb-3">
                    <h3>Luyện Viết Với AI - Thực Hành Tiếng Anh
                    <i
                        className="fas fa-question-circle help-icon"
                        style={{ cursor: "pointer" }}
                        onClick={() => setIsModalOpen(true)}
                    ></i>
                    </h3>
                </div>

                <WritingAIInput
                    topic={topic}
                    userText={userText}
                    setUserText={setUserText}
                    onSubmit={handleSubmit}
                    onReset={handleReset}
                    disabled={isSubmitting}
                    analysisResult={analysisResult}
                />

                <WritingAIResult analysisResult={analysisResult} />
            </div>
            {isModalOpen && (
                <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5>Hướng Dẫn Luyện Viết Với AI</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>Trong luyện viết AI, bạn sẽ nhận được một đề bài ngắn gọn do AI tạo ra để thực hành viết tiếng Anh.</p>
                            <p>
                                <strong>Các bước thực hiện:</strong>
                            </p>
                            <ul>
                                <li><strong>Viết bài:</strong> Nhập bài viết của bạn vào ô text bên dưới đề bài.</li>
                                <li><strong>Nộp bài:</strong> Nhấn nút <strong>Nộp bài</strong> để AI phân tích bài viết của bạn.</li>
                                <li><strong>Phân tích:</strong> AI sẽ đánh giá ngữ pháp, từ vựng, cấu trúc câu, và cung cấp phiên bản đã cải thiện cùng các gợi ý sửa.</li>
                                <li><strong>Điểm tổng quan:</strong> AI sẽ đưa ra điểm đánh giá tổng thể cho bài viết của bạn.</li>
                                <li><strong>Tiếp tục:</strong> Sau khi nhận phản hồi, nhấn nút <strong>Tiếp tục làm bài</strong> để nhận đề bài mới và luyện tiếp.</li>
                            </ul>
                            <p><strong>Lưu ý:</strong></p>
                            <ul>
                                <li>Hãy viết hết khả năng của bạn trước khi nộp bài.</li>
                                <li>Đọc kỹ các gợi ý của AI và thử áp dụng chúng cho bài viết tiếp theo để cải thiện kỹ năng.</li>
                            </ul>
                            <p>✍️ Chúc bạn luyện viết hiệu quả và tiến bộ mỗi ngày!</p>
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

export default WritingAI;