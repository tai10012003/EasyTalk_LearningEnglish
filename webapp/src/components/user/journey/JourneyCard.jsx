import React from "react";

function JourneyCard({ title, progress }) {
  return (
    <div className="col-md-12 mb-4">
        <div className="card journey-card">
            <div className="card-body d-flex flex-column justify-content-center align-items-center">
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
                <a href="#" className="btn btn-primary mt-3">
                    TIẾP TỤC
                </a>
            </div>
        </div>
    </div>
  );
}

export default JourneyCard;
