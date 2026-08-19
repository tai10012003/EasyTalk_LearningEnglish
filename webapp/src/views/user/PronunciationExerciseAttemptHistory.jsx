import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import { PronunciationExerciseService } from "@/services/PronunciationExerciseService.jsx";
import Swal from "sweetalert2";

const formatDateTime = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("vi-VN");
};

function PronunciationExerciseAttemptHistory() {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = "Lịch sử làm bài luyện tập phát âm - EasyTalk";
    }, []);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                const data = await PronunciationExerciseService.fetchPronunciationExerciseAttemptHistory(currentPage, 10);
                setItems(data.items || []);
                setTotalPages(data.totalPages || 1);
            } catch (error) {
                console.error("Error fetching pronunciation exercise history:", error);
                setItems([]);
                setTotalPages(1);
            } finally {
                setIsLoading(false);
            }
        };
        fetchHistory();
    }, [currentPage]);

    const handleDeleteHistory = async (attemptId) => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Xóa lịch sử làm bài?",
            text: "Lịch sử này sẽ bị xóa khỏi tài khoản của bạn.",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#dc3545",
            cancelButtonColor: "#6b7280",
        });
        if (!result.isConfirmed) return;
        try {
            await PronunciationExerciseService.deletePronunciationExerciseAttemptHistory(attemptId);
            setItems(prev => prev.filter(item => item.attemptId !== attemptId));
            Swal.fire({
                icon: "success",
                title: "Đã xóa lịch sử",
                timer: 1200,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error deleting pronunciation exercise history:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: error.message || "Có lỗi xảy ra khi xóa lịch sử."
            });
        }
    };

    if (isLoading) return <LoadingScreen />;

    return (
        <div className="exercise-history-page">
            <div className="exercise-history-hero">
                <h1 className="exercise-history-title">
                    <i className="fas fa-history me-2"></i> LỊCH SỬ LÀM BÀI LUYỆN TẬP PHÁT ÂM
                </h1>
            </div>

            <div className="container exercise-history-content">
                <div className="exercise-history-toolbar">
                    <button className="exercise-history-back-btn" type="button" onClick={() => navigate("/pronunciation-exercise")}>
                        <i className="fas fa-arrow-left"></i> Quay lại
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className="exercise-history-empty">
                        <p>Chưa có lịch sử làm bài nào.</p>
                    </div>
                ) : (
                    <div className="exercise-history-list">
                        {items.map((item) => (
                            <div className="exercise-history-card" key={item.attemptId}>
                                <div className="exercise-history-card-main">
                                    <div className="exercise-history-card-icon">
                                        <i className="fas fa-microphone"></i>
                                    </div>
                                    <div className="exercise-history-card-info">
                                        <div className="exercise-history-card-top">
                                            <span className={`exercise-history-status ${item.status === "completed" ? "completed" : "in-progress"}`}>
                                                {item.status === "completed" ? "Đã hoàn thành" : "Chưa hoàn thành"}
                                            </span>
                                            <span className="exercise-history-date">{formatDateTime(item.completedAt || item.startedAt)}</span>
                                        </div>
                                        <h3 className="exercise-history-card-title">{item.title}</h3>
                                        <div className="exercise-history-meta">
                                            <span><i className="fas fa-check-circle"></i> {item.correctCount}/{item.totalQuestions} câu đúng</span>
                                            <span><i className="fas fa-list-ol"></i> {item.answeredCount}/{item.totalQuestions}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="exercise-history-card-actions">
                                    <div className="exercise-history-score">{Math.round(item.score || 0)}%</div>
                                    <button
                                        className="exercise-history-delete-btn"
                                        type="button"
                                        onClick={() => handleDeleteHistory(item.attemptId)}
                                        title="Xóa"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                    <button
                                        className="exercise-history-detail-btn"
                                        type="button"
                                        onClick={() => navigate(`/pronunciation-exercise/history/${item.attemptId}`)}
                                    >
                                        <i className="fas fa-eye"></i> Xem chi tiết
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="exercise-history-pagination">
                        <button type="button" disabled={currentPage <= 1} onClick={() => setCurrentPage(page => page - 1)}>
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <span>{currentPage}/{totalPages}</span>
                        <button type="button" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(page => page + 1)}>
                            <i className="fas fa-arrow-right"></i>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PronunciationExerciseAttemptHistory;
