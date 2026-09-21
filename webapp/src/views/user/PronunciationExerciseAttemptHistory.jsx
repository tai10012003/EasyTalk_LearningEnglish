import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import { PronunciationExerciseService } from "@/services/PronunciationExerciseService.jsx";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

const formatDateTime = (value, locale) => {
    if (!value) return "";
    return new Date(value).toLocaleString(locale);
};

function PronunciationExerciseAttemptHistory() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = t("pronunciationExercisePage.attemptHistory.documentTitle");
    }, [t, i18n.language]);

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
            title: t("pronunciationExercisePage.attemptHistory.deleteConfirmTitle"),
            text: t("pronunciationExercisePage.attemptHistory.deleteConfirmText"),
            showCancelButton: true,
            confirmButtonText: t("pronunciationExercisePage.attemptHistory.deleteConfirm"),
            cancelButtonText: t("pronunciationExercisePage.attemptHistory.deleteCancel"),
            confirmButtonColor: "#dc3545",
            cancelButtonColor: "#6b7280",
        });
        if (!result.isConfirmed) return;
        try {
            await PronunciationExerciseService.deletePronunciationExerciseAttemptHistory(attemptId);
            setItems(prev => prev.filter(item => item.attemptId !== attemptId));
            Swal.fire({
                icon: "success",
                title: t("pronunciationExercisePage.attemptHistory.deleteSuccess"),
                timer: 1200,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error deleting pronunciation exercise history:", error);
            Swal.fire({
                icon: "error",
                title: t("pronunciationExercisePage.detail.errorTitle"),
                text: error.message || t("pronunciationExercisePage.attemptHistory.deleteError")
            });
        }
    };

    if (isLoading) return <LoadingScreen />;

    return (
        <div className="exercise-history-page">
            <div className="exercise-history-hero">
                <h1 className="exercise-history-title">
                    <i className="fas fa-history me-2"></i> {t("pronunciationExercisePage.attemptHistory.title")}
                </h1>
            </div>

            <div className="container exercise-history-content">
                <div className="exercise-history-toolbar">
                    <button className="exercise-history-back-btn" type="button" onClick={() => navigate("/pronunciation-exercise")}>
                        <i className="fas fa-arrow-left"></i> {t("pronunciationExercisePage.carousel.back")}
                    </button>
                </div>

                {items.length === 0 ? (
                    <div className="exercise-history-empty">
                        <p>{t("pronunciationExercisePage.attemptHistory.empty")}</p>
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
                                                {item.status === "completed" ? t("pronunciationExercisePage.attemptHistory.completed") : t("pronunciationExercisePage.attemptHistory.inProgress")}
                                            </span>
                                            <span className="exercise-history-date">{formatDateTime(item.completedAt || item.startedAt, i18n.language === "en" ? "en-US" : "vi-VN")}</span>
                                        </div>
                                        <h3 className="exercise-history-card-title">{item.title}</h3>
                                        <div className="exercise-history-meta">
                                            <span><i className="fas fa-check-circle"></i> {t("pronunciationExercisePage.attemptHistory.correctCount", { correct: item.correctCount, total: item.totalQuestions })}</span>
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
                                        title={t("pronunciationExercisePage.attemptHistory.deleteConfirm")}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                    <button
                                        className="exercise-history-detail-btn"
                                        type="button"
                                        onClick={() => navigate(`/pronunciation-exercise/history/${item.attemptId}`)}
                                    >
                                        <i className="fas fa-eye"></i> {t("pronunciationExercisePage.attemptHistory.viewDetail")}
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
