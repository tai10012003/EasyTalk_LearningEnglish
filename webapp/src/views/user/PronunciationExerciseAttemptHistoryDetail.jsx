import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import PronunciationExerciseHistoryReviewCarousel from "@/components/user/pronunciationexercise/PronunciationExerciseHistoryReviewCarousel.jsx";
import PronunciationExerciseHistoryReviewSidebar from "@/components/user/pronunciationexercise/PronunciationExerciseHistoryReviewSidebar.jsx";
import { PronunciationExerciseService } from "@/services/PronunciationExerciseService.jsx";
import { useTranslation } from "react-i18next";

function PronunciationExerciseAttemptHistoryDetail() {
    const { t, i18n } = useTranslation();
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAttempt = async () => {
            try {
                setIsLoading(true);
                const data = await PronunciationExerciseService.getPronunciationExerciseAttemptDetail(attemptId);
                setAttempt(data);
                document.title = data?.pronunciationExerciseContent?.title || t("pronunciationExercisePage.attemptHistory.detailDocumentTitle");
            } catch (error) {
                console.error("Error fetching pronunciation exercise attempt detail:", error);
                setAttempt(null);
            } finally {
                setIsLoading(false);
            }
        };
        if (attemptId) {
            fetchAttempt();
        }
    }, [attemptId, t, i18n.language]);

    if (isLoading) return <LoadingScreen />;

    if (!attempt || !Array.isArray(attempt.questionResults) || attempt.questionResults.length === 0) {
        return (
            <div className="exercise-history-detail-page">
                <div className="container exercise-history-detail-content">
                    <div className="exercise-history-empty">
                        <p>{t("pronunciationExercisePage.attemptHistory.empty")}</p>
                        <button className="exercise-history-back-btn mt-3" type="button" onClick={() => navigate("/pronunciation-exercise/history")}>
                            <i className="fas fa-arrow-left"></i> {t("pronunciationExercisePage.carousel.back")}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="exercise-history-detail-page">
            <div className="exercise-history-detail-hero">
                <div className="container exercise-history-detail-hero-inner">
                    <div>
                        <span className="exercise-history-detail-eyebrow">
                            <i className="fas fa-history"></i> {t("pronunciationExercisePage.attemptHistory.detailEyebrow")}
                        </span>
                        <h1 className="exercise-history-detail-title">{attempt.pronunciationExerciseContent?.title}</h1>
                        <div className="exercise-history-detail-stats">
                            <span><i className="fas fa-check-circle"></i> {t("pronunciationExercisePage.attemptHistory.correctCount", { correct: attempt.correctCount, total: attempt.totalQuestions })}</span>
                            <span><i className="fas fa-chart-line"></i> {Math.round(attempt.score || 0)}%</span>
                        </div>
                    </div>
                    <button className="exercise-history-detail-back" type="button" onClick={() => navigate("/pronunciation-exercise/history")}>
                        <i className="fas fa-arrow-left"></i> {t("pronunciationExercisePage.carousel.back")}
                    </button>
                </div>
            </div>

            <div className="container exercise-history-detail-content">
                <div className="row exercise-history-detail-grid">
                    <div className="col-md-7">
                        <div className="exercise-content-container">
                            <PronunciationExerciseHistoryReviewCarousel
                                questionResults={attempt.questionResults}
                                currentQuestionIndex={currentQuestionIndex}
                                onQuestionNavigation={setCurrentQuestionIndex}
                            />
                        </div>
                    </div>
                    <div className="col-md-5">
                        <PronunciationExerciseHistoryReviewSidebar
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

export default PronunciationExerciseAttemptHistoryDetail;
