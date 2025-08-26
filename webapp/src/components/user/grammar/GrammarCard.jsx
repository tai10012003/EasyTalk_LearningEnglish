import React from 'react';

function GrammarCard({ grammar }) {
  return (
    <div className="col-md-4 col-lg-4 mb-4">
        <div className="lesson-card">
            {grammar.images ? (
                <img src={`data:image/jpeg;base64,${grammar.images}`} alt={grammar.title} className="lesson-image" />
            ) : (
                <p className="no-image">Không có sẵn ảnh</p>
            )}
            <div className="lesson-info">
                <h4 className="lesson-title-card">{grammar.title}</h4>
                <p className="lesson-description">
                    {grammar.description.length > 80 ? `${grammar.description.substring(0, 80)}...` : grammar.description}
                </p>
                <a href={`/grammar/${grammar._id}`} className="lesson-link">
                    Vào học
                </a>
            </div>
        </div>
    </div>
  );
}

export default GrammarCard;