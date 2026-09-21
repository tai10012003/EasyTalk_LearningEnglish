import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

const DictationExerciseCard = ({ item, index, isUnlocked, isCurrent }) => {
    const { t } = useTranslation();
    const sentenceCount = item.sentenceCount ?? (item.content ? item.content.split('.').filter(Boolean).length : 0);
    return (
        <div className={`user-timeline-item ${index % 2 === 0 ? 'left' : 'right'} ${isUnlocked ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}`}>
            <div className="user-timeline-card" data-coach-target={isCurrent ? "agent-task-dictation-current" : undefined}>
                <div className="user-card-inner">
                    <div className="user-card-header">
                        <span className="user-step-badge">{t("dictationExercisePage.card.step", { number: index + 1 })}</span>
                        {isCurrent && isUnlocked && (
                            <span className="user-badge current">{t("dictationExercisePage.card.current")}</span>
                        )}
                        {isUnlocked && !isCurrent && (
                            <span className="user-badge completed">{t("dictationExercisePage.card.completed")}</span>
                        )}
                        {!isUnlocked && (
                            <span className="user-badge locked">{t("dictationExercisePage.card.locked")}</span>
                        )}
                    </div>
                    <h3 className="user-card-title">{item.title}</h3>
                    <p className="user-card-desc">
                        {t("dictationExercisePage.card.sentenceCount", { count: sentenceCount })}
                    </p>
                    <p className="user-card-desc">
                        {t("dictationExercisePage.card.studyCount", { count: item.studyCount || 0 })}
                    </p>
                    <div className="user-card-footer">
                        {isUnlocked && isCurrent ? (
                            <Link to={`/dictation-exercise/${item.slug}`} className="user-btn start">
                                <i className="fas fa-pen me-2"></i> {t("dictationExercisePage.card.start")}
                            </Link>
                        ) : isUnlocked ? (
                            <Link to={`/dictation-exercise/${item.slug}`} className="user-btn review">
                                <i className="fas fa-redo"></i> {t("dictationExercisePage.card.retry")}
                            </Link>
                        ) : (
                            <button className="user-btn disabled" disabled>
                                <i className="fas fa-lock"></i> {t("dictationExercisePage.card.locked")}
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

export default DictationExerciseCard;
