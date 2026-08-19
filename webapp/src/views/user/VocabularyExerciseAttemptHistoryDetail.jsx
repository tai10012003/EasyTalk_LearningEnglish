import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import VocabularyExerciseHistoryReviewCarousel from "@/components/user/vocabularyexercise/VocabularyExerciseHistoryReviewCarousel.jsx";
import VocabularyExerciseHistoryReviewSidebar from "@/components/user/vocabularyexercise/VocabularyExerciseHistoryReviewSidebar.jsx";
import { VocabularyExerciseService } from "@/services/VocabularyExerciseService.jsx";

function VocabularyExerciseAttemptHistoryDetail() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAttempt = async () => {
            try {
                setIsLoading(true);
                const data = await VocabularyExerciseService.getVocabularyExerciseAttemptDetail(attemptId);
                setAttempt(data);
                document.title = data?.vocabularyExerciseContent?.title || "Lịch sử luyện tập từ vựng";
            } catch (error) {
                console.error("Error fetching vocabulary exercise attempt detail:", error);
                setAttempt(null);
            } finally {
                setIsLoading(false);
            }
        };
        if (attemptId) {
            fetchAttempt();
        }
    }, [attemptId]);

    if (isLoading) return <LoadingScreen />;

    if (!attempt || !Array.isArray(attempt.questionResults) || attempt.questionResults.length === 0) {
        return (
            <div className="exercise-history-detail-page">
                <div className="container exercise-history-detail-content">
                    <div className="exercise-history-empty">
                        <p>Chưa có lịch sử làm bài nào.</p>
                        <button className="exercise-history-back-btn mt-3" type="button" onClick={() => navigate("/vocabulary-exercise/history")}>
                            <i className="fas fa-arrow-left"></i> Quay lại
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
                            <i className="fas fa-history"></i> Lịch sử làm bài luyện tập từ vựng
                        </span>
                        <h1 className="exercise-history-detail-title">{attempt.vocabularyExerciseContent?.title}</h1>
                        <div className="exercise-history-detail-stats">
                            <span><i className="fas fa-check-circle"></i> {attempt.correctCount}/{attempt.totalQuestions} câu đúng</span>
                            <span><i className="fas fa-chart-line"></i> {Math.round(attempt.score || 0)}%</span>
                        </div>
                    </div>
                    <button className="exercise-history-detail-back" type="button" onClick={() => navigate("/vocabulary-exercise/history")}>
                        <i className="fas fa-arrow-left"></i> Quay lại
                    </button>
                </div>
            </div>

            <div className="container exercise-history-detail-content">
                <div className="row exercise-history-detail-grid">
                    <div className="col-md-7">
                        <div className="exercise-content-container">
                            <VocabularyExerciseHistoryReviewCarousel
                                questionResults={attempt.questionResults}
                                currentQuestionIndex={currentQuestionIndex}
                                onQuestionNavigation={setCurrentQuestionIndex}
                            />
                        </div>
                    </div>
                    <div className="col-md-5">
                        <VocabularyExerciseHistoryReviewSidebar
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

export default VocabularyExerciseAttemptHistoryDetail;
