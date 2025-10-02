import React from 'react';
import { Link } from "react-router-dom";

function PronunciationCard({ pronunciation, isLocked }) {
    return (
        <div className="col-md-4 col-lg-4 mb-4">
            <div className={`lesson-card ${isLocked ? "locked" : ""}`}>
                {pronunciation.images ? (
                <img
                    src={`${pronunciation.images}`}
                    alt={pronunciation.title}
                    className="lesson-image"
                />
                ) : (
                    <div className="no-image">Không có sẵn ảnh</div>
                )}
                <div className="lesson-info">
                    <h4 className="lesson-title-card">{pronunciation.title}</h4>
                    <p className="lesson-description">
                        {pronunciation.description.length > 80 ? `${pronunciation.description.substring(0, 80)}...` : pronunciation.description}
                    </p>
                    {isLocked ? (
                            <button className="lesson-locked-btn" disabled>
                            <i className="fas fa-lock me-2"></i>
                            </button>
                        ) : (
                            <Link to={`/pronunciation/${pronunciation._id}`} className="lesson-link">
                            <i className="fas fa-book-open me-2"></i>Vào đọc
                            </Link>
                        )}
                </div>
            </div>
        </div>
    );
}

export default PronunciationCard;