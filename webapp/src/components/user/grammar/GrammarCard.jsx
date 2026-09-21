import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

const GrammarCard = ({ item, index, isUnlocked, isCurrent }) => {
    const { t } = useTranslation();

    return (
        <div className={`user-timeline-item ${index % 2 === 0 ? 'left' : 'right'} ${isUnlocked ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}`}>
            <div className="user-timeline-card">
                <div className="user-card-inner">
                    <div className="user-card-header">
                        <span className="user-step-badge">{t("grammarPage.card.step", { number: index + 1 })}</span>
                        {isCurrent && isUnlocked && (
                            <span className="user-badge current">{t("grammarPage.card.current")}</span>
                        )}
                        {isUnlocked && !isCurrent && (
                            <span className="user-badge completed">{t("grammarPage.card.completed")}</span>
                        )}
                        {!isUnlocked && (
                            <span className="user-badge locked">{t("grammarPage.card.locked")}</span>
                        )}
                    </div>
                    <h3 className="user-card-title">{item.title}</h3>
                    <p className="user-card-desc">
                        {(item.description || "").length > 85 ? `${item.description.substring(0, 85)}...`: item.description}
                    </p>
                    <p className="user-card-desc">Đã học: {item.studyCount || 0} lần</p>
                    {item.images && (
                        <img src={item.images} alt={item.title} className="user-card-img" />
                    )}
                    <div className="user-card-footer">
                        {isUnlocked && isCurrent ? (
                            <Link to={`/grammar/${item.slug}`} className="user-btn start">
                                <i className="fas fa-play"></i> {t("grammarPage.card.start")}
                            </Link>
                        ) : isUnlocked ? (
                            <Link to={`/grammar/${item.slug}`} className="user-btn review">
                                <i className="fas fa-redo"></i> {t("grammarPage.card.review")}
                            </Link>
                        ) : (
                            <button className="user-btn disabled" disabled>
                                <i className="fas fa-lock"></i> {t("grammarPage.card.locked")}
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

export default GrammarCard;
