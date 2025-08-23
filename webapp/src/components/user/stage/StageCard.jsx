import React from "react";

const StageCard = ({ stage }) => {
  return (
    <section className={`stage-card ${stage.unlocked ? "unlocked" : "locked"}`}>
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
    </section>
  );
};

export default StageCard;