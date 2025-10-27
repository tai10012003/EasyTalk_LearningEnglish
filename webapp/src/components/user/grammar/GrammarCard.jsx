import React from 'react';
import { Link } from "react-router-dom";

function GrammarCard({ grammar, isLocked }) {
    return (
        <div className="col-md-4 col-lg-4 mb-4">
            <div className={`lesson-card ${isLocked ? "locked" : ""}`}>
                {grammar.images ? (
                <img
                    src={`${grammar.images}`}
                    alt={grammar.title}
                    className="lesson-image"
                />
                ) : (
                    <div className="no-image">Không có sẵn ảnh</div>
                )}
                <div className="lesson-info">
                    <h4 className="lesson-title-card">{grammar.title}</h4>
                    <p className="lesson-description">
                        {grammar.description.length > 80 ? `${grammar.description.substring(0, 80)}...` : grammar.description}
                    </p>
                    {isLocked ? (
                            <button className="lesson-locked-btn" disabled>
                            <i className="fas fa-lock me-2"></i>
                            </button>
                        ) : (
                            <Link to={`/grammar/${grammar.slug}`} className="lesson-link">
                            <i className="fas fa-book-open me-2"></i>Vào đọc
                            </Link>
                        )}
                </div>
            </div>
        </div>
    );
}

export default GrammarCard;