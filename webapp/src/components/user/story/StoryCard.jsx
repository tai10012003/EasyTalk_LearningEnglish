import React from 'react';

function StoryCard({ story }) {
  return (
    <div className="col-md-4 col-lg-4 mb-4">
        <div className="lesson-card">
            {story.images ? (
                <img src={`data:image/jpeg;base64,${story.images}`} alt={story.title} className="lesson-image" />
            ) : (
                <p className="no-image">Không có sẵn ảnh</p>
            )}
            <div className="lesson-info">
                <h4 className="lesson-title-card">{story.title}</h4>
                <p className="lesson-category">
                    Chủ đề: {story.category}
                </p>
                <p className="lesson-level">
                    Mức độ: {story.level}
                </p>
                {/* <p className="lesson-description">
                    {story.description.length > 80 ? `${story.description.substring(0, 80)}...` : story.description}
                </p> */}
                <a href={`/story/${story._id}`} className="lesson-link">
                    Vào đọc
                </a>
            </div>
        </div>
    </div>
  );
}

export default StoryCard;