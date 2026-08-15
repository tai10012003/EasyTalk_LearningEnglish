import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import GrammarExerciseHistoryReviewCarousel from "@/components/user/grammarexercise/GrammarExerciseHistoryReviewCarousel.jsx";
import GrammarExerciseHistoryReviewSidebar from "@/components/user/grammarexercise/GrammarExerciseHistoryReviewSidebar.jsx";
import { GrammarExerciseService } from "@/services/GrammarExerciseService.jsx";
import { useTranslation } from "react-i18next";

function GrammarExerciseAttemptHistoryDetail() {
    const { t } = useTranslation();
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAttempt = async () => {
            try {
                setIsLoading(true);
                const data = await GrammarExerciseService.getGrammarExerciseAttemptDetail(attemptId);
                setAttempt(data);
                document.title = data?.grammarExerciseContent?.title || t("grammarExercisePage.history.title");
            } catch (error) {
                console.error("Error fetching grammar exercise attempt detail:", error);
                setAttempt(null);
            } finally {
                setIsLoading(false);
            }
        };
        if (attemptId) {
            fetchAttempt();
        }
    }, [attemptId, t]);

    if (isLoading) return <LoadingScreen />;

    if (!attempt || !Array.isArray(attempt.questionResults) || attempt.questionResults.length === 0) {
        return (
            <div className="grammar-history-detail-page">
                <div className="container grammar-history-detail-content">
                    <div className="grammar-history-empty">
                        <p>{t("grammarExercisePage.history.empty")}</p>
                        <button className="grammar-history-back-btn mt-3" type="button" onClick={() => navigate("/grammar-exercise/history")}>
                            <i className="fas fa-arrow-left"></i> {t("grammarExercisePage.carousel.back")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grammar-history-detail-page">
            <div className="grammar-history-detail-hero">
                <div className="container grammar-history-detail-hero-inner">
                    <div>
                        <span className="grammar-history-detail-eyebrow">
                            <i className="fas fa-history"></i> {t("grammarExercisePage.history.title")}
                        </span>
                        <h1 className="grammar-history-detail-title">{attempt.grammarExerciseContent?.title}</h1>
                        <div className="grammar-history-detail-stats">
                            <span><i className="fas fa-check-circle"></i> {attempt.correctCount}/{attempt.totalQuestions} {t("grammarExercisePage.history.correct").toLowerCase()}</span>
                            <span><i className="fas fa-chart-line"></i> {Math.round(attempt.score || 0)}%</span>
                        </div>
                    </div>
                    <button className="grammar-history-detail-back" type="button" onClick={() => navigate("/grammar-exercise/history")}>
                        <i className="fas fa-arrow-left"></i> {t("grammarExercisePage.carousel.back")}
                    </button>
                </div>
            </div>

            <div className="container grammar-history-detail-content">
            <div className="row grammar-history-detail-grid">
                <div className="col-md-7">
                    <div className="exercise-content-container">
                        <GrammarExerciseHistoryReviewCarousel
                            questionResults={attempt.questionResults}
                            currentQuestionIndex={currentQuestionIndex}
                            onQuestionNavigation={setCurrentQuestionIndex}
                        />
                    </div>
                </div>
                <div className="col-md-5">
                    <GrammarExerciseHistoryReviewSidebar
                        questionResults={attempt.questionResults}
                        currentQuestionIndex={currentQuestionIndex}
                        onQuestionNavigation={setCurrentQuestionIndex}
                        summary={attempt}
                    />
                </div>
            </div>
            </div>
        </div>
    );
}

export default GrammarExerciseAttemptHistoryDetail;
