import React, { useEffect, useState, useRef } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import GrammarExerciseCard from "@/components/user/grammarexercise/GrammarExerciseCard.jsx";
import { useNavigate } from "react-router-dom";
import { GrammarExerciseService } from "@/services/GrammarExerciseService.jsx";
import { Trans, useTranslation } from "react-i18next";

function GrammarExercise() {
    const { t, i18n } = useTranslation();
    const [allGrammarExercises, setAllGrammarExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unlockedGrammarExercises, setUnlockedGrammarExercises] = useState([]);
    const currentLessonRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = t("grammarExercisePage.list.documentTitle");
        GrammarExerciseService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const allResp = await GrammarExerciseService.fetchGrammarExercise(1, 10000);
                const all = allResp.data || [];
                setAllGrammarExercises(all);
                if (all.length > 0) {
                    try {
                        const detailResp = await GrammarExerciseService.getGrammarExerciseDetail(all[0]._id);
                        const userProg = detailResp?.userProgress || null;
                        const unlockedIds = Array.isArray(userProg?.unlockedGrammarExercises) ? userProg.unlockedGrammarExercises.map(s => s.toString()) : [];
                        setUnlockedGrammarExercises(unlockedIds);
                    } catch (err) {
                        console.error("Error fetching user progress:", err);
                        setUnlockedGrammarExercises([]);
                    }
                } else {
                    setUnlockedGrammarExercises([]);
                }
            } catch (err) {
                console.error("Error fetching grammar exercises:", err);
                setAllGrammarExercises([]);
                setUnlockedGrammarExercises([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate, t, i18n.language]);

    const isGrammarExerciseUnlocked = (grammarExerciseId) => {
        return unlockedGrammarExercises.includes(grammarExerciseId.toString());
    };

    const findCurrentGrammarExerciseIndex = () => {
        if (unlockedGrammarExercises.length === 0) return -1;
        const lastUnlockedId = unlockedGrammarExercises[unlockedGrammarExercises.length - 1];
        return allGrammarExercises.findIndex(item => item._id.toString() === lastUnlockedId);
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
                            <i className="fas fa-pen me-2"></i> {t("grammarExercisePage.list.title")}
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            {t("grammarExercisePage.list.subtitle", { unlocked: unlockedGrammarExercises.length, total: allGrammarExercises.length })}
                        </p>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${allGrammarExercises.length > 0 ? (unlockedGrammarExercises.length / allGrammarExercises.length) * 100 : 0}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {t("grammarExercisePage.list.completePercent", { percent: allGrammarExercises.length > 0 ? Math.round((unlockedGrammarExercises.length / allGrammarExercises.length) * 100) : 0 })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {allGrammarExercises.map((item, index) => {
                            const isUnlocked = isGrammarExerciseUnlocked(item._id);
                            const currentIndex = findCurrentGrammarExerciseIndex();
                            const isCurrent = index === currentIndex;
                            return (
                                <div key={item._id} ref={isCurrent ? currentLessonRef : null} >
                                    <GrammarExerciseCard item={item} index={index} isUnlocked={isUnlocked} isCurrent={isCurrent} />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="user-floating-buttons">
                    <button className="user-scroll-current-btn" onClick={scrollToCurrentLesson} title={t("grammarExercisePage.list.scrollCurrentTitle")} >
                        <i className="fas fa-play-circle"></i>
                        <span className="user-scroll-current-text">{t("grammarExercisePage.list.continuePractice")}</span>
                        <span className="user-scroll-hot-badge">{t("grammarExercisePage.list.hot")}</span>
                    </button>
                    <button className="user-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title={t("grammarExercisePage.list.scrollTopTitle")} >
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
                            <h5>{t("grammarExercisePage.list.guide.title")}</h5>
                            <button
                                className="close-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>{t("grammarExercisePage.list.guide.intro")}</p>
                            <p>{t("grammarExercisePage.list.guide.description")}</p>
                            <p><strong>{t("grammarExercisePage.list.guide.questionTypes")}</strong></p>
                            <ul>
                                <li><Trans i18nKey="grammarExercisePage.list.guide.multipleChoice" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="grammarExercisePage.list.guide.fillBlank" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="grammarExercisePage.list.guide.translation" components={{ strong: <strong /> }} /></li>
                            </ul>
                            <p><strong>{t("grammarExercisePage.list.guide.noteTitle")}</strong></p>
                            <ul>
                                <li><Trans i18nKey="grammarExercisePage.list.guide.noteCheck" components={{ strong: <strong /> }} /></li>
                                <li>{t("grammarExercisePage.list.guide.noteComplete")}</li>
                                <li>{t("grammarExercisePage.list.guide.noteTime")}</li>
                                <li><Trans i18nKey="grammarExercisePage.list.guide.noteSubmit" components={{ strong: <strong /> }} /></li>
                            </ul>
                            <p>{t("grammarExercisePage.list.guide.closing")}</p>
                        </div>
                        <div className="custom-modal-footer">
                            <button
                                className="footer-btn"
                                onClick={() => setIsModalOpen(false)}
                            >
                                {t("grammarExercisePage.common.close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading && <LoadingScreen />}
        </>
    );
}

export default GrammarExercise;
