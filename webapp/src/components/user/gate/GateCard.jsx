import React from "react";
import StageCard from "@/components/user/stage/StageCard.jsx";

const GateCard = ({ gate, index, total, isCurrent }) => {
  let currentStageIndexInGate = -1;
  let isCompleted = false;

  if (gate.unlocked) {
    const firstLockedIndex = gate.stages.findIndex(stage => !stage.unlocked);
    if (firstLockedIndex === -1) {
      isCompleted = gate.stages.length > 0;
      currentStageIndexInGate = gate.stages.length > 0 ? gate.stages.length - 1 : -1;
    } else if (firstLockedIndex === 0) {
      currentStageIndexInGate = 0;
    } else {
      currentStageIndexInGate = firstLockedIndex - 1;
    }
  }

  return (
    <div className="user-gate-item">
      {index < total - 1 && <div className="user-gate-connector" />}
      <div className={`user-gate-card ${gate.unlocked ? "unlocked" : "locked"} ${isCurrent ? "current" : ""} ${isCompleted ? "completed" : ""}`}>
        <div className="user-gate-card-header">
          <h4>{gate.title}</h4>
          {isCurrent && (
            <span className="user-gate-current-badge">Cổng hiện tại</span>
          )}
          {!isCurrent && isCompleted && (
            <span className="user-gate-completed-badge">
              Đã hoàn thành
            </span>
          )}
          {!gate.unlocked && (
            <span className="user-gate-locked-badge">
              Chưa mở khóa
            </span>
          )}
          <span className="user-gate-stage-count">
            {gate.stages.length} chặng
          </span>
        </div>
        {gate.stages.length === 0 ? (
          <div className="user-gate-empty">
            <p>Chưa có chặng nào ở cổng này!</p>
          </div>
        ) : (
          <div className="user-stage-grid">
            {gate.stages.map((stage, i) => {
              const isUnlocked = gate.unlocked && stage.unlocked;
              const isCurrentStage = isCurrent && i === currentStageIndexInGate;
              return (
                <StageCard
                  key={stage.id}
                  stage={stage}
                  gateUnlocked={gate.unlocked}
                  stageIndex={i + 1}
                  isUnlocked={isUnlocked}
                  isCurrentStage={isCurrentStage}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GateCard;