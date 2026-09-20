import React, { useEffect, useState, useRef } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import VocabularyExerciseCard from "@/components/user/vocabularyexercise/VocabularyExerciseCard.jsx";
import { useNavigate } from "react-router-dom";
import { VocabularyExerciseService } from "@/services/VocabularyExerciseService.jsx";
import { Trans, useTranslation } from "react-i18next";

function VocabularyExercise() {
    const { t, i18n } = useTranslation();
    const [allVocabularyExercises, setAllVocabularyExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unlockedVocabularyExercises, setUnlockedVocabularyExercises] = useState([]);
    const [roadmapProgress, setRoadmapProgress] = useState({ unlockedCount: 0, totalCount: 0, percent: 0 });
    const currentLessonRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = t("vocabularyExercisePage.list.documentTitle");
        VocabularyExerciseService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const roadmap = await VocabularyExerciseService.fetchVocabularyExerciseRoadmap();
                const items = roadmap.items || [];
                setAllVocabularyExercises(items);
                setUnlockedVocabularyExercises(items.filter(item => item.isUnlocked).map(item => item._id.toString()));
                setRoadmapProgress(roadmap.progress || { unlockedCount: 0, totalCount: items.length, percent: 0 });
            } catch (err) {
                console.error("Error fetching vocabulary exercises:", err);
                setAllVocabularyExercises([]);
                setUnlockedVocabularyExercises([]);
                setRoadmapProgress({ unlockedCount: 0, totalCount: 0, percent: 0 });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [t, i18n.language]);

    const isVocabularyExerciseUnlocked = (vocabularyExerciseId) => {
        return unlockedVocabularyExercises.includes(vocabularyExerciseId.toString());
    };

    const findCurrentVocabularyExerciseIndex = () => {
        if (unlockedVocabularyExercises.length === 0) return -1;
        const lastUnlockedId = unlockedVocabularyExercises[unlockedVocabularyExercises.length - 1];
        return allVocabularyExercises.findIndex(item => item._id.toString() === lastUnlockedId);
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
                            <i className="fas fa-spell-check me-2"></i> {t("vocabularyExercisePage.list.title")}
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            {t("vocabularyExercisePage.list.subtitle", { unlocked: roadmapProgress.unlockedCount, total: roadmapProgress.totalCount })}
                        </p>
                        <button className="btn_2 mb-4" type="button" onClick={() => navigate("/vocabulary-exercise/history")}>
                            <i className="fas fa-history"></i> {t("vocabularyExercisePage.list.history")}
                        </button>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${roadmapProgress.percent}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {t("vocabularyExercisePage.list.completePercent", { percent: roadmapProgress.percent })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {allVocabularyExercises.map((item, index) => {
                            const isUnlocked = item.isUnlocked ?? isVocabularyExerciseUnlocked(item._id);
                            const currentIndex = findCurrentVocabularyExerciseIndex();
                            const isCurrent = item.isCurrent ?? index === currentIndex;
                            return (
                                <div key={item._id} ref={isCurrent ? currentLessonRef : null} >
                                    <VocabularyExerciseCard item={item} index={index} isUnlocked={isUnlocked} isCurrent={isCurrent} />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="user-floating-buttons">
                    <button className="user-scroll-current-btn" onClick={scrollToCurrentLesson} title={t("vocabularyExercisePage.list.scrollCurrentTitle")} >
                        <i className="fas fa-play-circle"></i>
                        <span className="user-scroll-current-text">{t("vocabularyExercisePage.list.continuePractice")}</span>
                        <span className="user-scroll-hot-badge">{t("vocabularyExercisePage.list.hot")}</span>
                    </button>
                    <button className="user-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title={t("vocabularyExercisePage.list.scrollTopTitle")} >
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
                            <h5>{t("vocabularyExercisePage.list.guide.title")}</h5>
                            <button
                                className="close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>{t("vocabularyExercisePage.list.guide.intro")}</p>
                            <p>{t("vocabularyExercisePage.list.guide.description")}</p>
                            <p><strong>{t("vocabularyExercisePage.list.guide.questionTypes")}</strong></p>
                            <ul>
                                <li><Trans i18nKey="vocabularyExercisePage.list.guide.multipleChoice" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="vocabularyExercisePage.list.guide.fillBlank" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="vocabularyExercisePage.list.guide.translation" components={{ strong: <strong /> }} /></li>
                            </ul>
                            <p><strong>{t("vocabularyExercisePage.list.guide.noteTitle")}</strong></p>
                            <ul>
                                <li><Trans i18nKey="vocabularyExercisePage.list.guide.noteCheck" components={{ strong: <strong /> }} /></li>
                                <li>{t("vocabularyExercisePage.list.guide.noteComplete")}</li>
                                <li>{t("vocabularyExercisePage.list.guide.noteTime")}</li>
                                <li><Trans i18nKey="vocabularyExercisePage.list.guide.noteSubmit" components={{ strong: <strong /> }} /></li>
                            </ul>
                            <p>{t("vocabularyExercisePage.list.guide.closing")}</p>
                        </div>
                        <div className="custom-modal-footer">
                            <button
                                className="footer-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                {t("vocabularyExercisePage.common.close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading && <LoadingScreen />}
        </>
    );
}

export default VocabularyExercise;
