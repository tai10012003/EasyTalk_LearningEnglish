import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import { GrammarExerciseService } from "@/services/GrammarExerciseService.jsx";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";

const formatDateTime = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("vi-VN");
};

function GrammarExerciseAttemptHistory() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = t("grammarExercisePage.history.title");
    }, [t]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setIsLoading(true);
                const data = await GrammarExerciseService.fetchGrammarExerciseAttemptHistory(currentPage, 10);
                setItems(data.items || []);
                setTotalPages(data.totalPages || 1);
            } catch (error) {
                console.error("Error fetching grammar exercise history:", error);
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
            title: t("grammarExercisePage.history.deleteTitle", { defaultValue: "Xóa lịch sử làm bài?" }),
            text: t("grammarExercisePage.history.deleteText", { defaultValue: "Lịch sử này sẽ bị xóa khỏi tài khoản của bạn." }),
            showCancelButton: true,
            confirmButtonText: t("grammarExercisePage.history.deleteConfirm", { defaultValue: "Xóa" }),
            cancelButtonText: t("grammarExercisePage.sidebar.cancel"),
            confirmButtonColor: "#dc3545",
            cancelButtonColor: "#6b7280",
        });
        if (!result.isConfirmed) return;
        try {
            await GrammarExerciseService.deleteGrammarExerciseAttemptHistory(attemptId);
            setItems(prev => prev.filter(item => item.attemptId !== attemptId));
            Swal.fire({
                icon: "success",
                title: t("grammarExercisePage.history.deleteSuccess", { defaultValue: "Đã xóa lịch sử" }),
                timer: 1200,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error deleting grammar exercise history:", error);
            Swal.fire({
                icon: "error",
                title: t("grammarExercisePage.detail.errorTitle"),
                text: error.message || t("grammarExercisePage.detail.errorText")
            });
        }
    };

    if (isLoading) return <LoadingScreen />;

    return (
        <div className="grammar-history-page">
            <div className="grammar-history-hero">
                <h1 className="grammar-history-title">
                    <i className="fas fa-history me-2"></i> {t("grammarExercisePage.history.title")}
                </h1>
            </div>

            <div className="container grammar-history-content">
                <div className="grammar-history-toolbar">
                    <button className="grammar-history-back-btn" type="button" onClick={() => navigate("/grammar-exercise")}>
                        <i className="fas fa-arrow-left"></i> {t("grammarExercisePage.carousel.back")}
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className="grammar-history-empty">
                        <p>{t("grammarExercisePage.history.empty")}</p>
                    </div>
                ) : (
                    <div className="grammar-history-list">
                        {items.map((item) => (
                            <div className="grammar-history-card" key={item.attemptId}>
                                <div className="grammar-history-card-main">
                                    <div className="grammar-history-card-icon">
                                        <i className="fas fa-pen"></i>
                                    </div>
                                    <div className="grammar-history-card-info">
                                        <div className="grammar-history-card-top">
                                            <span className={`grammar-history-status ${item.status === "completed" ? "completed" : "in-progress"}`}>
                                                {item.status === "completed"
                                                    ? t("grammarExercisePage.history.completed", { defaultValue: "Đã hoàn thành" })
                                                    : t("grammarExercisePage.history.inProgress", { defaultValue: "Chưa hoàn thành" })}
                                            </span>
                                            <span className="grammar-history-date">{formatDateTime(item.completedAt || item.startedAt)}</span>
                                        </div>
                                        <h3 className="grammar-history-card-title">{item.title}</h3>
                                        <div className="grammar-history-meta">
                                            <span><i className="fas fa-check-circle"></i> {item.correctCount}/{item.totalQuestions} {t("grammarExercisePage.history.correct").toLowerCase()}</span>
                                            <span><i className="fas fa-list-ol"></i> {item.answeredCount}/{item.totalQuestions}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="grammar-history-card-actions">
                                    <div className="grammar-history-score">{Math.round(item.score || 0)}%</div>
                                    <button
                                        className="grammar-history-delete-btn"
                                        type="button"
                                        onClick={() => handleDeleteHistory(item.attemptId)}
                                        title={t("grammarExercisePage.history.deleteConfirm", { defaultValue: "Xóa" })}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                    <button
                                        className="grammar-history-detail-btn"
                                        type="button"
                                        onClick={() => navigate(`/grammar-exercise/history/${item.attemptId}`)}
                                    >
                                        <i className="fas fa-eye"></i> {t("grammarExercisePage.history.viewDetail", { defaultValue: "Xem chi tiết" })}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="grammar-history-pagination">
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

export default GrammarExerciseAttemptHistory;
