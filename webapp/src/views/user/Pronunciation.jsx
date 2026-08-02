import React, { useEffect, useState, useRef, useMemo } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import PronunciationCard from "@/components/user/pronunciation/PronunciationCard.jsx";
import { useNavigate } from "react-router-dom";
import { PronunciationService } from "@/services/PronunciationService.jsx";
import { Trans, useTranslation } from "react-i18next";

function Pronunciation() {
    const { t } = useTranslation();
    const [allPronunciations, setAllPronunciations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unlockedPronunciations, setUnlockedPronunciations] = useState([]);
    const currentLessonRef = useRef(null);
    const navigate = useNavigate();

    const levels = useMemo(() => [
        { key: "A1", name: t("pronunciationPage.list.levels.A1"), color: "#4CAF50" },
        { key: "A2", name: t("pronunciationPage.list.levels.A2"), color: "#8BC34A" },
        { key: "B1", name: t("pronunciationPage.list.levels.B1"), color: "#FFC107" },
        { key: "B2", name: t("pronunciationPage.list.levels.B2"), color: "#FF9800" },
        { key: "C1", name: t("pronunciationPage.list.levels.C1"), color: "#F44336" },
    ], [t]);

    const groupedPronunciations = useMemo(() => {
        const grouped = {};
        levels.forEach(l => (grouped[l.key] = {}));
        allPronunciations.forEach((item, index) => {
            let levelKey = item.level || "A1";
            let category = item.category || t("pronunciationPage.list.defaultCategory");
            if (!item.level || !item.category) {
                if (index < 20) levelKey = "A1";
                else if (index < 40) levelKey = "A2";
                else if (index < 70) levelKey = "B1";
                else if (index < 100) levelKey = "B2";
                else levelKey = "C1";
                if (index <= 4) category = t("pronunciationPage.list.fallbackCategories.module1");
                else if (index <= 9) category = t("pronunciationPage.list.fallbackCategories.module2");
                else if (index <= 14) category = t("pronunciationPage.list.fallbackCategories.module3");
                else if (index <= 19) category = t("pronunciationPage.list.fallbackCategories.module4");
                else category = t("pronunciationPage.list.advancedCategory", { module: Math.floor(index / 5) + 1 });
            }
            if (!grouped[levelKey][category]) {
                grouped[levelKey][category] = [];
            }
            grouped[levelKey][category].push({ ...item, originalIndex: index });
        });
        return grouped;
    }, [allPronunciations, levels, t]);

    useEffect(() => {
        document.title = t("pronunciationPage.list.documentTitle");
        PronunciationService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const allResp = await PronunciationService.fetchPronunciations(1, 10000);
                const all = allResp.data.pronunciations || [];
                setAllPronunciations(all);
                if (all.length > 0) {
                    try {
                        const detailResp = await PronunciationService.getPronunciationDetail(all[0]._id);
                        const userProg = detailResp?.userProgress || null;
                        const unlockedIds = Array.isArray(userProg?.unlockedPronunciations) ? userProg.unlockedPronunciations.map(s => s.toString()) : [];
                        setUnlockedPronunciations(unlockedIds);
                    } catch (err) {
                        console.error("Error fetching user progress:", err);
                        setUnlockedPronunciations([]);
                    }
                } else {
                    setUnlockedPronunciations([]);
                }
            } catch (err) {
                console.error("Error fetching pronunciations:", err);
                setAllPronunciations([]);
                setUnlockedPronunciations([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate, t]);

    const isPronunciationUnlocked = (pronunciationId) => {
        return unlockedPronunciations.includes(pronunciationId.toString());
    };

    const currentIndex = useMemo(() => {
        if (unlockedPronunciations.length === 0 || allPronunciations.length === 0) return -1;
        const lastUnlockedId = unlockedPronunciations[unlockedPronunciations.length - 1];
        return allPronunciations.findIndex(item => item._id.toString() === lastUnlockedId);
    }, [unlockedPronunciations, allPronunciations]);

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
                            <i className="fas fa-microphone-alt"></i> {t("pronunciationPage.list.title")}
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            {t("pronunciationPage.list.subtitle", { unlocked: unlockedPronunciations.length, total: allPronunciations.length })}
                        </p>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${allPronunciations.length > 0 ? (unlockedPronunciations.length / allPronunciations.length) * 100 : 0}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {t("pronunciationPage.list.completePercent", { percent: allPronunciations.length > 0 ? Math.round((unlockedPronunciations.length / allPronunciations.length) * 100) : 0 })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {levels.map((level) => {
                            const categories = groupedPronunciations[level.key];
                            if (!categories || Object.keys(categories).length === 0) return null;
                            return (
                                <div key={level.key} className="user-level-section">
                                    <div className="user-level-header" style={{ backgroundColor: level.color }}>
                                        <h3>{level.name}</h3>
                                    </div>
                                    {Object.keys(categories).map((categoryName) => {
                                        const items = categories[categoryName];
                                        return (
                                            <div key={categoryName} className="user-module-section">
                                                <div className="user-module-header">
                                                    <h3>{categoryName}</h3>
                                                </div>
                                                <div className="user-module-cards">
                                                    {items.map((item) => {
                                                        const isUnlocked = isPronunciationUnlocked(item._id);
                                                        const isCurrent = item.originalIndex === currentIndex;
                                                        return (
                                                            <div key={item._id} ref={isCurrent ? currentLessonRef : null}
                                                            >
                                                                <PronunciationCard item={item} index={item.originalIndex} isUnlocked={isUnlocked} isCurrent={isCurrent} />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className="user-floating-buttons">
                    <button className="user-scroll-current-btn" onClick={scrollToCurrentLesson} title={t("pronunciationPage.list.scrollCurrentTitle")} >
                        <i className="fas fa-play-circle"></i>
                        <span className="user-scroll-current-text">{t("pronunciationPage.list.continueLearning")}</span>
                        <span className="user-scroll-hot-badge">{t("pronunciationPage.list.hot")}</span>
                    </button>
                    <button className="user-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title={t("pronunciationPage.list.scrollTopTitle")} >
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
                            <h5><i className="fas fa-info-circle me-2"></i>{t("pronunciationPage.list.guide.title")}</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>
                                <Trans i18nKey="pronunciationPage.list.guide.intro" components={{ strong: <strong /> }} />
                            </p>
                            <p><strong>{t("pronunciationPage.list.guide.stepsTitle")}</strong></p>
                            <ol>
                                <li><Trans i18nKey="pronunciationPage.list.guide.step1" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="pronunciationPage.list.guide.step2" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="pronunciationPage.list.guide.step3" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="pronunciationPage.list.guide.step4" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="pronunciationPage.list.guide.step5" components={{ strong: <strong /> }} /></li>
                            </ol>
                            <p><strong>{t("pronunciationPage.list.guide.iconsTitle")}</strong></p>
                            <ul>
                                <li><i className="fas fa-check text-success"></i> <Trans i18nKey="pronunciationPage.list.guide.completedIcon" components={{ strong: <strong /> }} /></li>
                                <li><i className="fas fa-play-circle text-primary"></i> <Trans i18nKey="pronunciationPage.list.guide.currentIcon" components={{ strong: <strong /> }} /></li>
                                <li><i className="fas fa-lock text-muted"></i> <Trans i18nKey="pronunciationPage.list.guide.lockedIcon" components={{ strong: <strong /> }} /></li>
                            </ul>
                            <div className="alert alert-success mt-3" style={{fontSize: '0.95rem'}}>
                                <strong>{t("pronunciationPage.list.guide.tipLabel")}</strong>{" "}
                                <Trans i18nKey="pronunciationPage.list.guide.tipText" components={{ strong: <strong /> }} />
                            </div>
                            <p className="text-center mt-4">
                                <strong>{t("pronunciationPage.list.guide.closing")}</strong>
                            </p>
                        </div>
                        <div className="custom-modal-footer">
                            <button className="footer-btn" onClick={() => setIsModalOpen(false)}>
                                {t("pronunciationPage.list.guide.confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading && <LoadingScreen />}
        </>
    );
}

export default Pronunciation;
