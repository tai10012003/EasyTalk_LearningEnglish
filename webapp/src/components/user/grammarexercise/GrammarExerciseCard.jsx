import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

const GrammarExerciseCard = ({ item, index, isUnlocked, isCurrent }) => {
    const { t } = useTranslation();
    return (
        <div className={`user-timeline-item ${index % 2 === 0 ? 'left' : 'right'} ${isUnlocked ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}`}>
            <div className="user-timeline-card">
                <div className="user-card-inner">
                    <div className="user-card-header">
                        <span className="user-step-badge">{t("grammarExercisePage.card.step", { number: index + 1 })}</span>
                        {isCurrent && isUnlocked && (
                            <span className="user-badge current">{t("grammarExercisePage.card.current")}</span>
                        )}
                        {isUnlocked && !isCurrent && (
                            <span className="user-badge completed">{t("grammarExercisePage.card.completed")}</span>
                        )}
                        {!isUnlocked && (
                            <span className="user-badge locked">{t("grammarExercisePage.card.locked")}</span>
                        )}
                    </div>
                    <h3 className="user-card-title">{item.title}</h3>
                    <p className="user-card-desc">
                        {t("grammarExercisePage.card.questionCount", { count: item.questions ? item.questions.length : 0 })}
                    </p>
                    <div className="user-card-footer">
                        {isUnlocked && isCurrent ? (
                            <Link to={`/grammar-exercise/${item.slug}`} className="user-btn start">
                                <i className="fas fa-pen me-2"></i> {t("grammarExercisePage.card.start")}
                            </Link>
                        ) : isUnlocked ? (
                            <Link to={`/grammar-exercise/${item.slug}`} className="user-btn review">
                                <i className="fas fa-redo"></i> {t("grammarExercisePage.card.retry")}
                            </Link>
                        ) : (
                            <button className="user-btn disabled" disabled>
                                <i className="fas fa-lock"></i> {t("grammarExercisePage.card.locked")}
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

export default GrammarExerciseCard;
