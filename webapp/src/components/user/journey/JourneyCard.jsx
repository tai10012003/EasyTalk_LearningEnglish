import React from "react";
import { useTranslation } from "react-i18next";

function JourneyCard({ id, title, progress }) {
    const { t } = useTranslation();

    return (
        <div className="user-journey-card">
            <div className="user-journey-card-inner">
                <div className="user-journey-icon">
                    <i className="fas fa-route"></i>
                </div>
                <h3 className="user-journey-card-title">{title}</h3>
                <div className="user-journey-progress">
                    <div className="user-journey-progress-bar">
                        <div
                            className="user-journey-progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="user-journey-progress-text">
                        {t("journeyPage.card.completePercent", { percent: progress.toFixed(0) })}
                    </span>
                </div>
                <a href={`/journey/detail/${id}`} className="user-journey-btn">
                    <i className="fas fa-play"></i> {t("journeyPage.card.continue")}
                </a>
            </div>
        </div>
    );
}

export default JourneyCard;
