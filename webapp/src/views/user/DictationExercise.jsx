import React, { useEffect, useState, useRef } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import DictationExerciseCard from "@/components/user/dictationexercise/DictationExerciseCard.jsx";
import { DictationExerciseService } from "@/services/DictationExerciseService.jsx";
import { Trans, useTranslation } from "react-i18next";

function DictationExercise() {
    const { t, i18n } = useTranslation();
    const [allDictationExercises, setAllDictationExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [roadmapProgress, setRoadmapProgress] = useState({ unlockedCount: 0, totalCount: 0, percent: 0 });
    const currentLessonRef = useRef(null);

    useEffect(() => {
        document.title = t("dictationExercisePage.list.documentTitle");
        DictationExerciseService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const roadmap = await DictationExerciseService.fetchDictationExerciseRoadmap();
                setAllDictationExercises(roadmap.items || []);
                setRoadmapProgress(roadmap.progress || { unlockedCount: 0, totalCount: 0, percent: 0 });
            } catch (err) {
                console.error("Error fetching dictation exercises:", err);
                setAllDictationExercises([]);
                setRoadmapProgress({ unlockedCount: 0, totalCount: 0, percent: 0 });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [t, i18n.language]);

    const findCurrentDictationExerciseIndex = () => {
        return allDictationExercises.findIndex(item => item.isCurrent);
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
                            <i className="fas fa-headphones me-2"></i> {t("dictationExercisePage.list.title")}
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            {t("dictationExercisePage.list.subtitle", { unlocked: roadmapProgress.unlockedCount, total: roadmapProgress.totalCount || allDictationExercises.length })}
                        </p>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${roadmapProgress.percent || 0}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {t("dictationExercisePage.list.completePercent", { percent: roadmapProgress.percent || 0 })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {allDictationExercises.map((item, index) => {
                            const isUnlocked = Boolean(item.isUnlocked);
                            const currentIndex = findCurrentDictationExerciseIndex();
                            const isCurrent = index === currentIndex;
                            return (
                                <div key={item._id} ref={isCurrent ? currentLessonRef : null}>
                                    <DictationExerciseCard item={item} index={index} isUnlocked={isUnlocked} isCurrent={isCurrent} />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="user-floating-buttons">
                    <button className="user-scroll-current-btn" onClick={scrollToCurrentLesson} title={t("dictationExercisePage.list.scrollCurrentTitle")} >
                        <i className="fas fa-play-circle"></i>
                        <span className="user-scroll-current-text">{t("dictationExercisePage.list.continuePractice")}</span>
                        <span className="user-scroll-hot-badge">{t("dictationExercisePage.list.hot")}</span>
                    </button>
                    <button className="user-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title={t("dictationExercisePage.list.scrollTopTitle")} >
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
                            <h5>{t("dictationExercisePage.list.guide.title")}</h5>
                            <button
                                className="close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>{t("dictationExercisePage.list.guide.intro")}</p>
                            <p>{t("dictationExercisePage.list.guide.description")}</p>
                            <ul>
                                <li><Trans i18nKey="dictationExercisePage.list.guide.listen" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="dictationExercisePage.list.guide.dictation" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="dictationExercisePage.list.guide.skip" components={{ strong: <strong /> }} /></li>
                            </ul>
                            <p><Trans i18nKey="dictationExercisePage.list.guide.note" components={{ strong: <strong /> }} /></p>
                        </div>
                        <div className="custom-modal-footer">
                            <button
                                className="footer-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                {t("dictationExercisePage.common.close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading && <LoadingScreen />}
        </>
    );
}

export default DictationExercise;
