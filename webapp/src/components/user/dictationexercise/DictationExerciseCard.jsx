import React from 'react';
import { Link } from "react-router-dom";

function DictationExerciseCard({ exercise }) {
    return (
        <div className="col-md-4 col-lg-4 mb-4">
            <div className="lesson-card">
                <div className="lesson-info">
                    <h4 className="lesson-title-card">{exercise.title}</h4>
                    <p className="lesson-category">
                        Số câu: {exercise.content ? exercise.content.split('.').length : 0}
                    </p>
                    <Link to={`/dictation-exercise/${exercise._id}`} className="lesson-link">
                        <i className="fas fa-pencil-alt me-2"></i>Luyện tập
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default DictationExerciseCard;