import React from 'react';

function PronunciationCard({ pronunciation }) {
  return (
    <div className="col-md-4 col-lg-4 mb-4">
        <div className="lesson-card">
            {pronunciation.images ? (
                <img src={`data:image/jpeg;base64,${pronunciation.images}`} alt={pronunciation.title} className="lesson-image" />
            ) : (
                <p className="no-image">Không có sẵn ảnh</p>
            )}
            <div className="lesson-info">
                <h4 className="lesson-title-card">{pronunciation.title}</h4>
                <p className="lesson-description">
                    {pronunciation.description.length > 80 ? `${pronunciation.description.substring(0, 80)}...` : pronunciation.description}
                </p>
                <a href={`/pronunciation/${pronunciation._id}`} className="lesson-link">
                    <i className="fas fa-book-open me-2"></i>Vào học
                </a>
            </div>
        </div>
    </div>
  );
}

export default PronunciationCard;