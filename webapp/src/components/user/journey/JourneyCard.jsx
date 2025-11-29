import React from "react";

function JourneyCard({ id, title, progress }) {
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
                    <span className="user-journey-progress-text">{progress.toFixed(0)}% hoàn thành</span>
                </div>
                <a href={`/journey/detail/${id}`} className="user-journey-btn">
                    <i className="fas fa-play"></i> Tiếp tục học
                </a>
            </div>
        </div>
    );
}

export default JourneyCard;