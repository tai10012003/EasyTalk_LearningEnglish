import React from 'react';
import { Link } from "react-router-dom";

function VocabularyExerciseCard({ exercise }) {
    return (
        <div className="col-md-4 col-lg-4 mb-4">
            <div className="lesson-card">
                <div className="lesson-info">
                    <h4 className="lesson-title-card">{exercise.title}</h4>
                    <p className="lesson-category">
                        Số câu hỏi: {exercise.questions ? exercise.questions.length : 0}
                    </p>
                    <Link to={`/vocabulary-exercise/${exercise.slug}`} className="lesson-link">
                        <i className="fas fa-pencil-alt me-2"></i>Luyện tập
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default VocabularyExerciseCard;