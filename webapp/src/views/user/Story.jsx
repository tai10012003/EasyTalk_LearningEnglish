import React, { useEffect, useState, useRef } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import StoryCard from "@/components/user/story/StoryCard.jsx";
import { useNavigate } from "react-router-dom";
import { StoryService } from "@/services/StoryService.jsx";
import { Trans, useTranslation } from "react-i18next";

function Story() {
    const { t } = useTranslation();
    const [allStories, setAllStories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unlockedStories, setUnlockedStories] = useState([]);
    const currentLessonRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = t("storyPage.list.documentTitle");
        StoryService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const allResp = await StoryService.fetchStories(1, 10000);
                const all = allResp.data || [];
                setAllStories(all);
                if (all.length > 0) {
                    try {
                        const detailResp = await StoryService.getStoryDetail(all[0]._id);
                        const userProg = detailResp?.userProgress || null;
                        const unlockedIds = Array.isArray(userProg?.unlockedStories) ? userProg.unlockedStories.map(s => s.toString()) : [];
                        setUnlockedStories(unlockedIds);
                    } catch (err) {
                        console.error("Error fetching user progress:", err);
                        setUnlockedStories([]);
                    }
                } else {
                    setUnlockedStories([]);
                }
            } catch (err) {
                console.error("Error fetching stories:", err);
                setAllStories([]);
                setUnlockedStories([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate, t]);

    const isStoryUnlocked = (storyId) => {
        return unlockedStories.includes(storyId.toString());
    };

    const findCurrentStoryIndex = () => {
        if (unlockedStories.length === 0) return -1;
        const lastUnlockedId = unlockedStories[unlockedStories.length - 1];
        return allStories.findIndex(item => item._id.toString() === lastUnlockedId);
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
                            <i className="fas fa-book"></i> {t("storyPage.list.title")}
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            {t("storyPage.list.subtitle", { unlocked: unlockedStories.length, total: allStories.length })}
                        </p>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${allStories.length > 0 ? (unlockedStories.length / allStories.length) * 100 : 0}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {t("storyPage.list.completePercent", { percent: allStories.length > 0 ? Math.round((unlockedStories.length / allStories.length) * 100) : 0 })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {allStories.map((item, index) => {
                            const isUnlocked = isStoryUnlocked(item._id);
                            const currentIndex = findCurrentStoryIndex();
                            const isCurrent = index === currentIndex;
                            return (
                                <div key={item._id} ref={isCurrent ? currentLessonRef : null} >
                                    <StoryCard item={item} index={index} isUnlocked={isUnlocked} isCurrent={isCurrent} />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="user-floating-buttons">
                    <button className="user-scroll-current-btn" onClick={scrollToCurrentLesson} title={t("storyPage.list.scrollCurrentTitle")} >
                        <i className="fas fa-play-circle"></i>
                        <span className="user-scroll-current-text">{t("storyPage.list.continueLearning")}</span>
                        <span className="user-scroll-hot-badge">{t("storyPage.list.hot")}</span>
                    </button>
                    <button className="user-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title={t("storyPage.list.scrollTopTitle")} >
                        <i className="fas fa-arrow-up"></i>
                    </button>
                </div>
            </div>
            {isModalOpen && (
                <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5>{t("storyPage.list.guide.title")}</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>{t("storyPage.list.guide.intro")}</p>
                            <p>
                                <strong>{t("storyPage.list.guide.featuresTitle")}</strong>
                            </p>
                            <ul>
                                <li><Trans i18nKey="storyPage.list.guide.next" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="storyPage.list.guide.back" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="storyPage.list.guide.translation" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="storyPage.list.guide.listen" components={{ strong: <strong /> }} /></li>
                            </ul>
                            <p><strong>{t("storyPage.list.guide.noteTitle")}</strong></p>
                            <ul>
                                <li>{t("storyPage.list.guide.note1")}</li>
                                <li>{t("storyPage.list.guide.note2")}</li>
                            </ul>
                            <p>{t("storyPage.list.guide.closing")}</p>
                        </div>
                        <div className="custom-modal-footer">
                            <button className="footer-btn" onClick={() => setIsModalOpen(false)}>{t("storyPage.list.guide.confirm")}</button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading && <LoadingScreen />}
        </>
    );
}

export default Story;
