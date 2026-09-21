import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

const StoryCard = ({ item, index, isUnlocked, isCurrent }) => {
    const { t } = useTranslation();
    return (
        <div className={`user-timeline-item ${index % 2 === 0 ? 'left' : 'right'} ${isUnlocked ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}`}>
            <div className="user-timeline-card">
                <div className="user-card-inner">
                    <div className="user-card-header">
                        <span className="user-step-badge">{t("storyPage.card.step", { number: index + 1 })}</span>
                        {isCurrent && isUnlocked && (
                            <span className="user-badge current">{t("storyPage.card.current")}</span>
                        )}
                        {isUnlocked && !isCurrent && (
                            <span className="user-badge completed">{t("storyPage.card.completed")}</span>
                        )}
                        {!isUnlocked && (
                            <span className="user-badge locked">{t("storyPage.card.locked")}</span>
                        )}
                    </div>
                    <h3 className="user-card-title">{item.title}</h3>
                    <p className="user-card-desc">{t("storyPage.card.category", { category: item.category })}</p>
                    <p className="user-card-desc">{t("storyPage.card.level", { level: item.level })}</p>
                    <p className="user-card-desc">Đã học: {item.studyCount || 0} lần</p>
                    {(item.image || item.images) && (
                        <img src={item.image || item.images} alt={item.title} className="user-card-img" />
                    )}
                    <div className="user-card-footer">
                        {isUnlocked && isCurrent ? (
                            <Link to={`/story/${item.slug}`} className="user-btn start">
                                <i className="fas fa-book-open me-2"></i> {t("storyPage.card.start")}
                            </Link>
                        ) : isUnlocked ? (
                            <Link to={`/story/${item.slug}`} className="user-btn review">
                                <i className="fas fa-redo"></i> {t("storyPage.card.review")}
                            </Link>
                        ) : (
                            <button className="user-btn disabled" disabled>
                                <i className="fas fa-lock"></i> {t("storyPage.card.locked")}
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="user-timeline-dot">
                {isUnlocked ? (
                    isCurrent ? <i className="fas fa-play-circle"></i> : <i className="fas fa-check"></i>
                ) : (
                    <i className="fas fa-lock"></i>
                )}
            </div>
        </div>
    );
}

export default StoryCard;
