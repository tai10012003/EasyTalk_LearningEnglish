import React from "react";
import StageCard from "../stage/StageCard";

const GateCard = ({ gate }) => {
  return (
    <section className="gate-card-wrapper">
      <div className={`gate-card ${gate.unlocked ? "unlocked" : "locked"}`}>
        <h5 className="gate-title text-center">{gate.title}</h5>
        <p className="card-text text-center">
          Số lượng chặng: {gate.stages.length}
        </p>
      </div>
      <div className="stage-list">
        {gate.stages.map((stage) => (
          <StageCard key={stage.id} stage={stage} />
        ))}
      </div>
    </section>
  );
};

export default GateCard;