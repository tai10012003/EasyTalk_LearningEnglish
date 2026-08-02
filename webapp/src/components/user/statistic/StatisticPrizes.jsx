import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const StatisticPrizes = ({ prizesLoading, allPrizes, userPrizes, championStats, isPrizeUnlocked, getPrizesByType, username = null }) => {
    const { t, i18n } = useTranslation();
    const isOwnStats = !username;
    const title = isOwnStats ? t("statisticPage.prizes.ownTitle") : t("statisticPage.prizes.userTitle", { username });
    const locale = i18n.language === "en" ? "en-US" : "vi-VN";
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState("");
    const [modalTitle, setModalTitle] = useState("");

    const getChampionHistory = (type) => {
        let codePrefix = '';
        if (type === 'champion_week') codePrefix = 'CHAMPION_WEEK';
        else if (type === 'champion_month') codePrefix = 'CHAMPION_MONTH';
        else if (type === 'champion_year') codePrefix = 'CHAMPION_YEAR';
        return userPrizes
            .filter(p => {
                const matches = p.code?.startsWith(codePrefix) || p.code === codePrefix;
                return matches && p.period;
            })
            .map(p => {
                const prizeDetail = allPrizes.find(ap => ap.code === p.code);
                return {
                    period: p.period,
                    periodDisplay: formatPeriodDisplay(p.period),
                    name: prizeDetail?.name || t("statisticPage.prizes.champion.defaultName"),
                    diamondAwards: prizeDetail?.diamondAwards || 0,
                    iconClass: prizeDetail?.iconClass || 'fas fa-crown',
                    unlockedAt: p.unlockedAt ? new Date(p.unlockedAt).toLocaleDateString(locale) : "N/A",
                };
            })
            .sort((a, b) => b.period.localeCompare(a.period));
    };

    const formatPeriodDisplay = (period) => {
        if (!period) return t("statisticPage.common.unknown");
        if (period.includes('-W')) {
            const match = period.match(/(\d{4})-W(\d{2})/);
            if (match) {
                const year = match[1];
                const week = parseInt(match[2], 10);
                return t("statisticPage.prizes.history.weekPeriod", { week, year });
            }
        } else if (/^\d{4}-\d{2}$/.test(period)) {
            const [year, month] = period.split('-');
            return t("statisticPage.prizes.history.monthPeriod", { month: parseInt(month, 10), year });
        } else if (/^\d{4}$/.test(period)) {
            return t("statisticPage.prizes.history.yearPeriod", { year: period });
        }
        return period;
    };

    const openModal = (type, title) => {
        setModalType(type);
        setModalTitle(title);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setModalType("");
        setModalTitle("");
    };

    return (
        <div className="user-statistic-prizes">
            <h3 className="user-statistic-info-title">{title}</h3>
            {prizesLoading ? (
                <div className="user-statistic-prize-loading">
                    <i className="fas fa-spinner fa-spin"></i> {t("statisticPage.prizes.loading")}
                </div>
            ) : (
                <>
                    <div className="user-statistic-prize-section">
                        <h4 className="user-statistic-prize-section-title">
                            <i className="fas fa-fire"></i> {t("statisticPage.prizes.perfectStreak.title")}
                            {isOwnStats && (
                                <div className="user-statistic-prize-info-icon">
                                    <i className="fas fa-info-circle"></i>
                                    <div className="user-statistic-prize-tooltip">
                                        <strong>{t("statisticPage.prizes.howToEarn")}</strong>
                                        <p>{t("statisticPage.prizes.perfectStreak.description")}</p>
                                        <ul>
                                            <li>{t("statisticPage.prizes.perfectStreak.level1")}</li>
                                            <li>{t("statisticPage.prizes.perfectStreak.level2")}</li>
                                            <li>{t("statisticPage.prizes.perfectStreak.level3")}</li>
                                            <li>...</li>
                                            <li>{t("statisticPage.prizes.perfectStreak.level10")}</li>
                                        </ul>
                                        <p className="user-statistic-prize-tooltip-note">
                                            <i className="fas fa-exclamation-triangle"></i> 
                                            {t("statisticPage.prizes.perfectStreak.note")}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </h4>
                        <div className="user-statistic-prize-grid">
                            {getPrizesByType('perfect_streak').map((prize) => {
                                const unlocked = isPrizeUnlocked(prize.code);
                                return (
                                    <div 
                                        key={prize._id} 
                                        className={`user-statistic-prize-item ${unlocked ? 'unlocked' : 'locked'}`}
                                        title={unlocked ? t("statisticPage.prizes.tooltip.unlocked", { name: prize.name }) : t("statisticPage.prizes.tooltip.lockedStreak", { name: prize.name, days: prize.requirement.streakDays })}
                                    >
                                        <div className="user-statistic-prize-icon">
                                            <i className={prize.iconClass}></i>
                                        </div>
                                        <div className="user-statistic-prize-info">
                                            <div className="user-statistic-prize-name">{prize.name}</div>
                                            <div className="user-statistic-prize-requirement">
                                                {t("statisticPage.values.days", { count: prize.requirement.streakDays })}
                                            </div>
                                            <div className="user-statistic-prize-awards">
                                                {t("statisticPage.prizes.receiveDiamondsShort", { count: prize.diamondAwards })}
                                            </div>
                                        </div>
                                        {unlocked && (
                                            <div className="user-statistic-prize-badge">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="user-statistic-prize-section">
                        <h4 className="user-statistic-prize-section-title">
                            <i className="fas fa-graduation-cap"></i> {t("statisticPage.prizes.knowledgeGod.title")}
                            {isOwnStats && (
                                <div className="user-statistic-prize-info-icon">
                                    <i className="fas fa-info-circle"></i>
                                    <div className="user-statistic-prize-tooltip">
                                        <strong>{t("statisticPage.prizes.howToEarn")}</strong>
                                        <p>{t("statisticPage.prizes.knowledgeGod.description")}</p>
                                        <ul>
                                            <li>{t("statisticPage.prizes.knowledgeGod.source1")}</li>
                                            <li>{t("statisticPage.prizes.knowledgeGod.source2")}</li>
                                            <li>{t("statisticPage.prizes.knowledgeGod.source3")}</li>
                                            <li>{t("statisticPage.prizes.knowledgeGod.source4")}</li>
                                        </ul>
                                        <p>{t("statisticPage.prizes.knowledgeGod.requirementIntro")}</p>
                                        <ul>
                                            <li>{t("statisticPage.prizes.knowledgeGod.level1")}</li>
                                            <li>{t("statisticPage.prizes.knowledgeGod.level2")}</li>
                                            <li>{t("statisticPage.prizes.knowledgeGod.level3")}</li>
                                            <li>...</li>
                                            <li>{t("statisticPage.prizes.knowledgeGod.level10")}</li>
                                        </ul>
                                        <p className="user-statistic-prize-tooltip-tip">
                                            <i className="fas fa-lightbulb"></i> 
                                            {t("statisticPage.prizes.knowledgeGod.tip")}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </h4>
                        <div className="user-statistic-prize-grid">
                            {getPrizesByType('knowledge_god').map((prize) => {
                                const unlocked = isPrizeUnlocked(prize.code);
                                return (
                                    <div 
                                        key={prize._id} 
                                        className={`user-statistic-prize-item ${unlocked ? 'unlocked' : 'locked'}`}
                                        title={unlocked ? t("statisticPage.prizes.tooltip.unlocked", { name: prize.name }) : t("statisticPage.prizes.tooltip.lockedExp", { name: prize.name, value: prize.requirement.xp.toLocaleString() })}
                                    >
                                        <div className="user-statistic-prize-icon">
                                            <i className={prize.iconClass}></i>
                                        </div>
                                        <div className="user-statistic-prize-info">
                                            <div className="user-statistic-prize-name">{prize.name}</div>
                                            <div className="user-statistic-prize-requirement">
                                                {t("statisticPage.values.exp", { value: prize.requirement.xp.toLocaleString() })}
                                            </div>
                                            <div className="user-statistic-prize-awards">
                                                {t("statisticPage.prizes.receiveDiamondsShort", { count: prize.diamondAwards })}
                                            </div>
                                        </div>
                                        {unlocked && (
                                            <div className="user-statistic-prize-badge">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="user-statistic-prize-section">
                        <h4 className="user-statistic-prize-section-title">
                            <i className="fas fa-crown"></i> {t("statisticPage.prizes.champion.title")}
                            {isOwnStats && (
                                <div className="user-statistic-prize-info-icon">
                                    <i className="fas fa-info-circle"></i>
                                    <div className="user-statistic-prize-tooltip champion-tooltip">
                                        <strong>{t("statisticPage.prizes.howToEarn")}</strong>
                                        <p>{t("statisticPage.prizes.champion.description")}</p>
                                        <div className="user-statistic-prize-tooltip-champion-section">
                                            <div className="user-statistic-prize-tooltip-champion-item">
                                                <i className="fas fa-star"></i>
                                                <div>
                                                    <strong>{t("statisticPage.prizes.champion.weekTitle")}</strong>
                                                    <p>{t("statisticPage.prizes.champion.weekDescription")}</p>
                                                    <p>{t("statisticPage.prizes.receiveDiamonds", { count: 100 })}</p>
                                                </div>
                                            </div>
                                            <div className="user-statistic-prize-tooltip-champion-item">
                                                <i className="fas fa-medal"></i>
                                                <div>
                                                    <strong>{t("statisticPage.prizes.champion.monthTitle")}</strong>
                                                    <p>{t("statisticPage.prizes.champion.monthDescription")}</p>
                                                    <p>{t("statisticPage.prizes.receiveDiamonds", { count: 500 })}</p>
                                                </div>
                                            </div>
                                            <div className="user-statistic-prize-tooltip-champion-item">
                                                <i className="fas fa-crown"></i>
                                                <div>
                                                    <strong>{t("statisticPage.prizes.champion.yearTitle")}</strong>
                                                    <p>{t("statisticPage.prizes.champion.yearDescription")}</p>
                                                    <p>{t("statisticPage.prizes.receiveDiamonds", { count: 6500 })}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="user-statistic-prize-tooltip-note champion-note">
                                            {t("statisticPage.prizes.champion.note")}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </h4>
                        <div className="user-statistic-prize-champion-grid">
                            {getPrizesByType('champion_week').map((prize) => {
                                const unlocked = isPrizeUnlocked(prize.code);
                                return (
                                    <div 
                                        key={prize._id} 
                                        className={`user-statistic-prize-champion ${unlocked ? 'unlocked' : 'locked'}`}
                                        title={unlocked ? t("statisticPage.prizes.tooltip.unlocked", { name: prize.name }) : t("statisticPage.prizes.tooltip.locked", { name: prize.name })}
                                    >
                                        <div className="user-statistic-prize-champion-icon">
                                            <i className={prize.iconClass}></i>
                                        </div>
                                        <div className="user-statistic-prize-champion-name">{prize.name}</div>
                                        <div className="user-statistic-prize-champion-count">{championStats.week}</div>
                                        <div className="user-statistic-prize-awards">
                                            {t("statisticPage.prizes.receiveDiamondsShort", { count: prize.diamondAwards })}
                                        </div>
                                        <button onClick={() => openModal("champion_week", t("statisticPage.prizes.history.weekTitle"))} className="user-statistic-prize-champion-button">
                                            {t("statisticPage.prizes.viewDetails")}
                                        </button>
                                        {unlocked && (
                                            <div className="user-statistic-prize-champion-badge">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {getPrizesByType('champion_month').map((prize) => {
                                const unlocked = isPrizeUnlocked(prize.code);
                                return (
                                    <div 
                                        key={prize._id} 
                                        className={`user-statistic-prize-champion ${unlocked ? 'unlocked' : 'locked'}`}
                                        title={unlocked ? t("statisticPage.prizes.tooltip.unlocked", { name: prize.name }) : t("statisticPage.prizes.tooltip.locked", { name: prize.name })}
                                    >
                                        <div className="user-statistic-prize-champion-icon">
                                            <i className={prize.iconClass}></i>
                                        </div>
                                        <div className="user-statistic-prize-champion-name">{prize.name}</div>
                                        <div className="user-statistic-prize-champion-count">{championStats.month}</div>
                                        <div className="user-statistic-prize-awards">
                                            {t("statisticPage.prizes.receiveDiamondsShort", { count: prize.diamondAwards })}
                                        </div>
                                        <button onClick={() => openModal("champion_month", t("statisticPage.prizes.history.monthTitle"))} className="user-statistic-prize-champion-button">
                                            {t("statisticPage.prizes.viewDetails")}
                                        </button>
                                        {unlocked && (
                                            <div className="user-statistic-prize-champion-badge">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {getPrizesByType('champion_year').map((prize) => {
                                const unlocked = isPrizeUnlocked(prize.code);
                                return (
                                    <div 
                                        key={prize._id} 
                                        className={`user-statistic-prize-champion ${unlocked ? 'unlocked' : 'locked'}`}
                                        title={unlocked ? t("statisticPage.prizes.tooltip.unlocked", { name: prize.name }) : t("statisticPage.prizes.tooltip.locked", { name: prize.name })}
                                    >
                                        <div className="user-statistic-prize-champion-icon">
                                            <i className={prize.iconClass}></i>
                                        </div>
                                        <div className="user-statistic-prize-champion-name">{prize.name}</div>
                                        <div className="user-statistic-prize-champion-count">{championStats.year}</div>
                                        <div className="user-statistic-prize-awards">
                                            {t("statisticPage.prizes.receiveDiamondsShort", { count: prize.diamondAwards })}
                                        </div>
                                        <button onClick={() => openModal("champion_year", t("statisticPage.prizes.history.yearTitle"))} className="user-statistic-prize-champion-button">
                                            {t("statisticPage.prizes.viewDetails")}
                                        </button>
                                        {unlocked && (
                                            <div className="user-statistic-prize-champion-badge">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
            {showModal && (
                <div className="user-statistic-modal-overlay" onClick={closeModal}>
                    <div className="user-statistic-modal" onClick={e => e.stopPropagation()}>
                        <div className="user-statistic-modal-header">
                            <h5>{modalTitle}</h5>
                            <button onClick={closeModal} className="user-statistic-modal-close">
                                ×
                            </button>
                        </div>
                        <div className="user-statistic-modal-body">
                            {getChampionHistory(modalType).length === 0 ? (
                                <p className="text-center text-gray-500 py-8">
                                    {t("statisticPage.prizes.history.empty")}
                                </p>
                            ) : (
                                <div className="user-statistic-card-list">
                                    {getChampionHistory(modalType).map((item, index) => (
                                        <div key={index} className="user-statistic-card-item">
                                            <div className="user-statistic-card-icon">
                                                <i className={`${item.iconClass} fa-2x`}></i>
                                            </div>
                                            <div className="user-statistic-card-info">
                                                <div className="font-bold text-lg">{item.name}</div>
                                                <div className="text-sm opacity-80">
                                                    {t("statisticPage.prizes.history.period")}: <strong>{item.periodDisplay}</strong>
                                                </div>
                                                <div className="text-sm">
                                                    {t("statisticPage.prizes.history.reward")}: <strong>{t("statisticPage.prizes.diamonds", { count: item.diamondAwards })}</strong>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {t("statisticPage.prizes.history.receivedDate")}: {item.unlockedAt}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="user-statistic-modal-footer">
                            <button onClick={closeModal} className="user-statistic-modal-btn">
                                {t("statisticPage.common.close")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatisticPrizes;
