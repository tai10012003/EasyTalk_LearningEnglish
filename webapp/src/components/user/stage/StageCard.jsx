import React from "react";
import { useTranslation } from "react-i18next";

const StageCard = ({ stage, isUnlocked, isCurrentStage }) => {
  const { t } = useTranslation();

  return (
    <div className={`user-stage-card ${isUnlocked ? "unlocked" : "locked"} ${isCurrentStage ? "current" : ""}`}>
      <h4 className="user-stage-title">{stage.title}</h4>
      <div className="user-stage-action">
        {isUnlocked && isCurrentStage ? (
          <a href={`/stage/${stage.id}`} className="user-stage-btn start">
            <i className="fas fa-play"></i>{t("journeyPage.stageCard.start")}
          </a>
        ) : isUnlocked ? (
          <a href={`/stage/${stage.id}`} className="user-stage-btn review">
            <i className="fas fa-redo"></i>{t("journeyPage.stageCard.review")}
          </a>
        ) : (
          <button className="user-stage-btn locked" disabled>
            <i className="fas fa-lock"></i>{t("journeyPage.stageCard.locked")}
          </button>
        )}
      </div>
    </div>
  );
};

export default StageCard;
