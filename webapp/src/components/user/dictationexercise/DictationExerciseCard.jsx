import React from 'react';
import { Link } from "react-router-dom";

function DictationExerciseCard({ exercise, isLocked }) {
    return (
        <div className="col-md-4 col-lg-4 mb-4">
            <div className={`lesson-card ${isLocked ? "locked" : ""}`}>
                <div className="lesson-info">
                    <h4 className="lesson-title-card">{exercise.title}</h4>
                    <p className="lesson-category">
                        Số câu: {exercise.content ? exercise.content.split('.').length : 0}
                    </p>
                    {isLocked ? (
                        <button className="lesson-locked-btn" disabled>
                            <i className="fas fa-lock me-2"></i>
                        </button>
                    ) : (
                        <Link to={`/dictation-exercise/${exercise.slug}`} className="lesson-link">
                            <i className="fas fa-pencil-alt me-2"></i>Luyện tập
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DictationExerciseCard;