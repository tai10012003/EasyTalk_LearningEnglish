import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";

const VocabularyExerciseCard = ({ item, index, isUnlocked, isCurrent }) => {
    const { t } = useTranslation();
    const questionCount = item.questionCount ?? (item.questions ? item.questions.length : 0);
    return (
        <div className={`user-timeline-item ${index % 2 === 0 ? 'left' : 'right'} ${isUnlocked ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}`}>
            <div className="user-timeline-card">
                <div className="user-card-inner">
                    <div className="user-card-header">
                        <span className="user-step-badge">{t("vocabularyExercisePage.card.step", { number: index + 1 })}</span>
                        {isCurrent && isUnlocked && (
                            <span className="user-badge current">{t("vocabularyExercisePage.card.current")}</span>
                        )}
                        {isUnlocked && !isCurrent && (
                            <span className="user-badge completed">{t("vocabularyExercisePage.card.completed")}</span>
                        )}
                        {!isUnlocked && (
                            <span className="user-badge locked">{t("vocabularyExercisePage.card.locked")}</span>
                        )}
                    </div>
                    <h3 className="user-card-title">{item.title}</h3>
                    <p className="user-card-desc">
                        {t("vocabularyExercisePage.card.questionCount", { count: questionCount })}
                    </p>
                    <div className="user-card-footer">
                        {isUnlocked && isCurrent ? (
                            <Link to={`/vocabulary-exercise/${item.slug}`} className="user-btn start">
                                <i className="fas fa-pen me-2"></i> {t("vocabularyExercisePage.card.start")}
                            </Link>
                        ) : isUnlocked ? (
                            <Link to={`/vocabulary-exercise/${item.slug}`} className="user-btn review">
                                <i className="fas fa-redo"></i> {t("vocabularyExercisePage.card.retry")}
                            </Link>
                        ) : (
                            <button className="user-btn disabled" disabled>
                                <i className="fas fa-lock"></i> {t("vocabularyExercisePage.card.locked")}
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

export default VocabularyExerciseCard;
