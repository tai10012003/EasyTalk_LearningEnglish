import React, { useEffect, useState, useRef } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import PronunciationExerciseCard from "@/components/user/pronunciationexercise/PronunciationExerciseCard.jsx";
import { useNavigate } from "react-router-dom";
import { PronunciationExerciseService } from "@/services/PronunciationExerciseService.jsx";
import { Trans, useTranslation } from "react-i18next";

function PronunciationExercise() {
    const { t, i18n } = useTranslation();
    const [allPronunciationExercises, setAllPronunciationExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roadmapProgress, setRoadmapProgress] = useState({ unlockedCount: 0, totalCount: 0, percent: 0 });
    const currentLessonRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = t("pronunciationExercisePage.list.documentTitle");
        PronunciationExerciseService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const roadmap = await PronunciationExerciseService.fetchPronunciationExerciseRoadmap();
                setAllPronunciationExercises(roadmap.items || []);
                setRoadmapProgress(roadmap.progress || { unlockedCount: 0, totalCount: 0, percent: 0 });
            } catch (err) {
                console.error("Error fetching pronunciation exercises:", err);
                setAllPronunciationExercises([]);
                setRoadmapProgress({ unlockedCount: 0, totalCount: 0, percent: 0 });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate, t, i18n.language]);

    const findCurrentPronunciationExerciseIndex = () => {
        return allPronunciationExercises.findIndex(item => item.isCurrent);
    };

    const scrollToCurrentLesson = () => {
        if (currentLessonRef.current) {
            currentLessonRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    };

    return (
        <>
            <div className="user-road-roadmap">
                <div className="user-road-header">
                    <div className="container">
                        <h1 className="user-road-title">
                            <i className="fas fa-volume-up me-2"></i> {t("pronunciationExercisePage.list.title")}
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            {t("pronunciationExercisePage.list.subtitle", { unlocked: roadmapProgress.unlockedCount, total: roadmapProgress.totalCount || allPronunciationExercises.length })}
                        </p>
                        <button className="btn_2 mb-4" type="button" onClick={() => navigate("/pronunciation-exercise/history")}>
                            <i className="fas fa-history"></i> {t("pronunciationExercisePage.list.history")}
                        </button>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${roadmapProgress.percent || 0}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {t("pronunciationExercisePage.list.completePercent", { percent: roadmapProgress.percent || 0 })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {allPronunciationExercises.map((item, index) => {
                            const isUnlocked = Boolean(item.isUnlocked);
                            const currentIndex = findCurrentPronunciationExerciseIndex();
                            const isCurrent = index === currentIndex;
                            return (
                                <div key={item._id} ref={isCurrent ? currentLessonRef : null} >
                                    <PronunciationExerciseCard item={item} index={index} isUnlocked={isUnlocked} isCurrent={isCurrent} />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="user-floating-buttons">
                    <button className="user-scroll-current-btn" onClick={scrollToCurrentLesson} title={t("pronunciationExercisePage.list.scrollCurrentTitle")} >
                        <i className="fas fa-play-circle"></i>
                        <span className="user-scroll-current-text">{t("pronunciationExercisePage.list.continuePractice")}</span>
                        <span className="user-scroll-hot-badge">{t("pronunciationExercisePage.list.hot")}</span>
                    </button>
                    <button className="user-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title={t("pronunciationExercisePage.list.scrollTopTitle")} >
                        <i className="fas fa-arrow-up"></i>
                    </button>
                </div>
            </div>
            {isModalOpen && (
                <div
                    className="custom-modal-overlay"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5>{t("pronunciationExercisePage.list.guide.title")}</h5>
                            <button
                                className="close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>{t("pronunciationExercisePage.list.guide.intro")}</p>
                            <p>{t("pronunciationExercisePage.list.guide.description")}</p>
                            <p><strong>{t("pronunciationExercisePage.list.guide.questionTypes")}</strong></p>
                            <ul>
                                <li><Trans i18nKey="pronunciationExercisePage.list.guide.multipleChoice" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="pronunciationExercisePage.list.guide.pronunciation" components={{ strong: <strong /> }} /></li>
                            </ul>
                            <p><strong>{t("pronunciationExercisePage.list.guide.noteTitle")}</strong></p>
                            <ul>
                                <li><Trans i18nKey="pronunciationExercisePage.list.guide.noteCheck" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="pronunciationExercisePage.list.guide.notePronunciation" components={{ strong: <strong /> }} /></li>
                                <li>{t("pronunciationExercisePage.list.guide.noteTime")}</li>
                                <li><Trans i18nKey="pronunciationExercisePage.list.guide.noteSubmit" components={{ strong: <strong /> }} /></li>
                            </ul>
                            <p>{t("pronunciationExercisePage.list.guide.closing")}</p>
                        </div>
                        <div className="custom-modal-footer">
                            <button
                                className="footer-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                {t("pronunciationExercisePage.common.close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading && <LoadingScreen />}
        </>
    );
}

export default PronunciationExercise;
