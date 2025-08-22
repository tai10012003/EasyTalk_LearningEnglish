import React from "react";

const StageCard = ({ stage }) => {
  return (
    <div className={`stage-card ${stage.unlocked ? "unlocked" : "locked"}`}>
      <h6 className="stage-title">{stage.title}</h6>
      {stage.unlocked ? (
        <a href={`/stage/${stage.id}`} className="btn btn-journey">
          VÀO HỌC
        </a>
      ) : (
        <button className="btn btn-journey" disabled>
          KHÓA
        </button>
      )}
    </div>
  );
};

export default StageCard;