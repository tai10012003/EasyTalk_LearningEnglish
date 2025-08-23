import React from 'react';

function StoryCard({ story }) {
  return (
    <div className="col-md-4">
        <div className="story-card">
            {story.images ? (
                <img src={`data:image/jpeg;base64,${story.images}`} alt={story.title} className="story-image" />
            ) : (
            <p className="no-image">Không có sẵn ảnh</p>
            )}
            <div className="story-info">
                <h4 className="story-title-card">{story.title}</h4>
                <p className="story-description">
                    {story.description.length > 80 ? `${story.description.substring(0, 80)}...` : story.description}
                </p>
                <a href={`/story/detail/${story._id}`} className="story-link">
                    Vào đọc
                </a>
            </div>
        </div>
    </div>
  );
}

export default StoryCard;