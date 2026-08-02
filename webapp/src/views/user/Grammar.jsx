import React, { useEffect, useState, useRef, useMemo } from "react";
import LoadingScreen from '@/components/user/LoadingScreen.jsx';
import GrammarCard from "@/components/user/grammar/GrammarCard.jsx";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import { GrammarService } from "@/services/GrammarService.jsx";

function Grammar() {
    const { t } = useTranslation();
    const [allGrammars, setAllGrammars] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [unlockedGrammars, setUnlockedGrammars] = useState([]);
    const currentLessonRef = useRef(null);
    const navigate = useNavigate();
    const currentLanguage = useSelector((state) => state.language.current);

    const levels = useMemo(() => [
        { key: "A1", name: t("grammarPage.list.levels.A1"), color: "#4CAF50" },
        { key: "A2", name: t("grammarPage.list.levels.A2"), color: "#8BC34A" },
        { key: "B1", name: t("grammarPage.list.levels.B1"), color: "#FFC107" },
        { key: "B2", name: t("grammarPage.list.levels.B2"), color: "#FF9800" },
        { key: "C1", name: t("grammarPage.list.levels.C1"), color: "#F44336" },
    ], [t]);

    const groupedGrammars = useMemo(() => {
        const grouped = {};
        levels.forEach(l => (grouped[l.key] = {}));
        allGrammars.forEach((item, index) => {
            let levelKey = item.level || "A1";
            let category = item.category || t("grammarPage.list.defaultCategory");
            if (!grouped[levelKey][category]) {
                grouped[levelKey][category] = [];
            }
            grouped[levelKey][category].push({ ...item, originalIndex: index });
        });
        return grouped;
    }, [allGrammars, levels, t]);

    useEffect(() => {
        document.title = t("grammarPage.list.documentTitle");
        GrammarService.resetAlertFlag();
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const allResp = await GrammarService.fetchGrammars(1, 10000);
                const all = allResp.grammars || [];
                setAllGrammars(all);
                if (all.length > 0) {
                    try {
                        const detailResp = await GrammarService.getGrammarDetail(all[0]._id);
                        const userProg = detailResp?.userProgress || null;
                        const unlockedIds = Array.isArray(userProg?.unlockedGrammars) ? userProg.unlockedGrammars.map(s => s.toString()) : [];
                        setUnlockedGrammars(unlockedIds);
                    } catch (err) {
                        console.error("Error fetching user progress:", err);
                        setUnlockedGrammars([]);
                    }
                } else {
                    setUnlockedGrammars([]);
                }
            } catch (err) {
                console.error("Error fetching grammars:", err);
                setAllGrammars([]);
                setUnlockedGrammars([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [navigate, currentLanguage, t]);

    const isGrammarUnlocked = (grammarId) => {
        return unlockedGrammars.includes(grammarId.toString());
    };

    const currentIndex = useMemo(() => {
        if (unlockedGrammars.length === 0 || allGrammars.length === 0) return -1;
        const lastUnlockedId = unlockedGrammars[unlockedGrammars.length - 1];
        return allGrammars.findIndex(item => item._id.toString() === lastUnlockedId);
    }, [unlockedGrammars, allGrammars]);

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
                            <i className="fas fa-language me-2"></i> {t("grammarPage.list.title")}
                            <i
                                className="fas fa-question-circle help-icon"
                                style={{ cursor: "pointer", marginLeft: "10px" }}
                                onClick={() => setIsModalOpen(true)}
                            ></i>
                        </h1>
                        <p className="user-road-subtitle">
                            {t("grammarPage.list.subtitle", { unlocked: unlockedGrammars.length, total: allGrammars.length })}
                        </p>
                        <div className="user-road-progress">
                            <div className="user-progress-bar">
                                <div className="user-progress-fill" style={{ width: `${allGrammars.length > 0 ? (unlockedGrammars.length / allGrammars.length) * 100 : 0}%` }}/>
                            </div>
                            <span className="user-progress-text">
                                {t("grammarPage.list.completePercent", { percent: allGrammars.length > 0 ? Math.round((unlockedGrammars.length / allGrammars.length) * 100) : 0 })}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="container">
                    <div className="user-road-timeline">
                        {levels.map((level) => {
                            const categories = groupedGrammars[level.key];
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
                                                        const isUnlocked = isGrammarUnlocked(item._id);
                                                        const isCurrent = item.originalIndex === currentIndex;
                                                        return (
                                                            <div key={item._id} ref={isCurrent ? currentLessonRef : null}
                                                            >
                                                                <GrammarCard item={item} index={item.originalIndex} isUnlocked={isUnlocked} isCurrent={isCurrent} />
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
                    <button className="user-scroll-current-btn" onClick={scrollToCurrentLesson} title={t("grammarPage.list.scrollCurrentTitle")}>
                        <i className="fas fa-play-circle"></i>
                        <span className="user-scroll-current-text">{t("grammarPage.list.continueLearning")}</span>
                        <span className="user-scroll-hot-badge">{t("grammarPage.list.hot")}</span>
                    </button>
                    <button className="user-scroll-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} title={t("grammarPage.list.scrollTopTitle")}>
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
                            <h5><i className="fas fa-info-circle me-2"></i>{t("grammarPage.list.guide.title")}</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>
                                <Trans i18nKey="grammarPage.list.guide.intro" components={{ strong: <strong /> }} />{" "}
                                {t("grammarPage.list.guide.intro2")}
                            </p>
                            <p><strong>{t("grammarPage.list.guide.stepsTitle")}</strong></p>
                            <ol>
                                <li><Trans i18nKey="grammarPage.list.guide.step1" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="grammarPage.list.guide.step2" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="grammarPage.list.guide.step3" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="grammarPage.list.guide.step4" components={{ strong: <strong /> }} /></li>
                                <li><Trans i18nKey="grammarPage.list.guide.step5" components={{ strong: <strong /> }} /></li>
                            </ol>
                            <p><strong>{t("grammarPage.list.guide.iconsTitle")}</strong></p>
                            <ul>
                                <li><i className="fas fa-check text-success"></i> <Trans i18nKey="grammarPage.list.guide.completedIcon" components={{ strong: <strong /> }} /></li>
                                <li><i className="fas fa-play-circle text-primary"></i> <Trans i18nKey="grammarPage.list.guide.currentIcon" components={{ strong: <strong /> }} /></li>
                                <li><i className="fas fa-lock text-muted"></i> <Trans i18nKey="grammarPage.list.guide.lockedIcon" components={{ strong: <strong /> }} /></li>
                            </ul>
                            <div className="alert alert-success mt-3" style={{fontSize: '0.95rem'}}>
                                <strong>{t("grammarPage.list.guide.tipLabel")}</strong>{" "}
                                <Trans i18nKey="grammarPage.list.guide.tipText" components={{ strong: <strong /> }} />
                            </div>
                            <p className="text-center mt-4">
                                <strong>{t("grammarPage.list.guide.closing")}</strong>
                            </p>
                        </div>
                        <div className="custom-modal-footer">
                            <button className="footer-btn" onClick={() => setIsModalOpen(false)}>
                                {t("grammarPage.list.guide.confirm")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isLoading && <LoadingScreen />}
        </>
    );
}

export default Grammar;
