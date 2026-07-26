import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
import { UNSAFE_NavigationContext } from "react-router-dom";
import { WritingAIService } from "@/services/WritingAIService.jsx";
import { LearningAgentService } from "@/services/LearningAgentService.jsx";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import WritingAIInput from "@/components/user/writingAI/WritingAIInput.jsx";
import WritingAIResult from "@/components/user/writingAI/WritingAIResult.jsx";
import Swal from "sweetalert2";

function WritingAI() {
    const [topic, setTopic] = useState("");
    const [writingModes, setWritingModes] = useState([]);
    const [selectedMode, setSelectedMode] = useState(null);
    const [userText, setUserText] = useState("");
    const [analysisResult, setAnalysisResult] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { navigator } = useContext(UNSAFE_NavigationContext);
    const allowNavigationRef = useRef(false);
    const hasStarted = userText.trim().length > 0 && !analysisResult;

    const pickModeTopic = useCallback((mode) => {
        const topics = mode?.config?.topicSuggestions || [];
        if (!topics.length) return null;
        return topics[Math.floor(Math.random() * topics.length)];
    }, []);

    const fetchTopic = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const generatedTopic = await WritingAIService.getRandomTopic();
            setTopic(generatedTopic);
        } catch (err) {
            console.error("Error fetching topic:", err);
            setTopic("Không thể lấy đề bài. Vui lòng thử lại.");
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, []);

    const loadWritingSetup = useCallback(async () => {
        setIsLoading(true);
        try {
            const modes = await LearningAgentService.getModes("writing");
            setWritingModes(modes);
            const firstMode = modes[0] || null;
            setSelectedMode(firstMode);
            const modeTopic = pickModeTopic(firstMode);
            if (modeTopic) {
                setTopic(modeTopic);
            } else {
                await fetchTopic(false);
            }
        } catch (err) {
            console.error("Error loading writing modes:", err);
            await fetchTopic(false);
        } finally {
            setIsLoading(false);
        }
    }, [fetchTopic, pickModeTopic]);

    useEffect(() => {
        document.title = "Luyện viết với AI - EasyTalk";
        loadWritingSetup();
    }, [loadWritingSetup]);

    const handleModeSelect = (mode) => {
        setSelectedMode(mode);
        setAnalysisResult(null);
        setUserText("");
        const modeTopic = pickModeTopic(mode);
        if (modeTopic) {
            setTopic(modeTopic);
        } else {
            fetchTopic(false);
        }
    };

    const handleSubmit = async () => {
        const trimmedText = userText.trim();
        if (!trimmedText)
            return Swal.fire({
                icon: "warning",
                title: "Chú ý",
                text: "Vui lòng nhập bài viết trước khi nộp!",
            });
        const minCharacters = selectedMode?.config?.minCharacters || 200;
        if (trimmedText.length < minCharacters) {
            return Swal.fire({
                icon: "warning",
                title: "Chú ý",
                text: `Bài viết của bạn phải ít nhất ${minCharacters} ký tự mới được phép nộp bài!`,
            });
        }
        setIsSubmitting(true);
        try {
            const result = await WritingAIService.analyzeWriting(trimmedText, selectedMode?.key || null);
            setAnalysisResult(result);
        } catch (err) {
            console.error("Error analyzing writing:", err);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể phân tích bài viết. Vui lòng thử lại.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = async () => {
        setUserText("");
        setAnalysisResult(null);
        const modeTopic = pickModeTopic(selectedMode);
        if (modeTopic) {
            setTopic(modeTopic);
        } else {
            fetchTopic();
        }
    };

    useEffect(() => {
        if (!navigator || !hasStarted) return;
        const originalPush = navigator.push;
        const originalReplace = navigator.replace;
        const handleNavigation = async (originalMethod, args) => {
            if (!allowNavigationRef.current && hasStarted) {
                const result = await Swal.fire({
                    icon: "warning",
                    title: "Cảnh báo",
                    text: "Bạn đang viết bài. Nếu rời trang, nội dung sẽ bị mất. Bạn có chắc muốn rời đi?",
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

    if (isLoading) return <LoadingScreen />;

    return (
        <>
            <div className="container writingai-container" data-coach-target="agent-task-writing-workspace">
                <div className="writingai-header text-center mb-3">
                    <h3>{selectedMode?.title ? `Luyện viết: ${selectedMode.title}` : "Luyện Viết Với AI - Thực Hành Tiếng Anh"}
                    <i
                        className="fas fa-question-circle help-icon"
                        style={{ cursor: "pointer" }}
                        onClick={() => setIsModalOpen(true)}
                    ></i>
                    </h3>
                    {selectedMode?.description && <p className="agent-mode-subtitle">{selectedMode.description}</p>}
                </div>

                <div className="agent-mode-grid writing-mode-grid">
                    {writingModes.map((mode) => (
                        <button
                            key={mode.key}
                            className={`agent-mode-card ${selectedMode?.key === mode.key ? "active" : ""}`}
                            onClick={() => handleModeSelect(mode)}
                            disabled={isSubmitting}
                        >
                            <div className="agent-mode-card-top">
                                <span>{mode.estimatedMinutes || 10} phút</span>
                                {mode.recommendedScore > 0 && <strong>Gợi ý</strong>}
                            </div>
                            <h4>{mode.title}</h4>
                            <p>{mode.description}</p>
                            <div className="agent-mode-skills">
                                {(mode.skillFocus || []).slice(0, 3).map((skill) => (
                                    <span key={skill}>{skill}</span>
                                ))}
                            </div>
                        </button>
                    ))}
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
