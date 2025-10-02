import React from 'react';
import { Link } from "react-router-dom";

function StoryCard({ story, isLocked }) {
    return (
        <div className="col-md-4 col-lg-4 mb-4">
            <div className={`lesson-card ${isLocked ? "locked" : ""}`}>
                {story.image ? (
                    <img
                        src={`${story.image}`}
                        alt={story.title}
                        className="lesson-image"
                    />
                    ) : (
                    <div className="no-image">Không có sẵn ảnh</div>
                )}

                <div className="lesson-info">
                    <h4 className="lesson-title-card">{story.title}</h4>
                    <p className="lesson-category">Chủ đề: {story.category}</p>
                    <p className="lesson-level">Mức độ: {story.level}</p>
                    {isLocked ? (
                        <button className="lesson-locked-btn" disabled>
                        <i className="fas fa-lock me-2"></i>
                        </button>
                    ) : (
                        <Link to={`/story/${story._id}`} className="lesson-link">
                        <i className="fas fa-book-open me-2"></i>Vào đọc
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default StoryCard;
