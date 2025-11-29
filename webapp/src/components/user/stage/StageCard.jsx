import React from "react";

const StageCard = ({ stage, isUnlocked, isCurrentStage }) => {
  return (
    <div className={`user-stage-card ${isUnlocked ? "unlocked" : "locked"} ${isCurrentStage ? "current" : ""}`}>
      <h4 className="user-stage-title">{stage.title}</h4>
      <div className="user-stage-action">
        {isUnlocked && isCurrentStage ? (
          <a href={`/stage/${stage.id}`} className="user-stage-btn start">
            <i className="fas fa-play"></i>Vào học
          </a>
        ) : isUnlocked ? (
          <a href={`/stage/${stage.id}`} className="user-stage-btn review">
            <i className="fas fa-redo"></i>Ôn lại
          </a>
        ) : (
          <button className="user-stage-btn locked" disabled>
            <i className="fas fa-lock"></i>Khóa
          </button>
        )}
      </div>
    </div>
  );
};

export default StageCard;