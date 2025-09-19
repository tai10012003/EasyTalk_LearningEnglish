import React from "react";

function JourneyCard({ id, title, progress }) {
  return (
    <section className="card journey-card">
        <h5 className="card-title">{title}</h5>
        <div className="progress-container">
            <div className="progress-label">
                Hoàn thành: <span>{progress.toFixed(2)}%</span>
            </div>
            <div className="progress">
                <div
                    className="progress-bar"
                    role="progressbar"
                    style={{ width: `${progress}%` }}
                    aria-valuenow={progress}
                    aria-valuemin="0"
                    aria-valuemax="100"
                ></div>
            </div>
        </div>
        <a href={`/journey/detail/${id}`} className="btn btn-journey mt-3">
            TIẾP TỤC
        </a>
    </section>
  );
}

export default JourneyCard;