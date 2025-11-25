import React from 'react';
import { Link } from 'react-router-dom';

const StoryCard = ({ item, index, isUnlocked, isCurrent }) => {
    return (
        <div className={`user-timeline-item ${index % 2 === 0 ? 'left' : 'right'} ${isUnlocked ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}`}>
            <div className="user-timeline-card">
                <div className="user-card-inner">
                    <div className="user-card-header">
                        <span className="user-step-badge">Bước {index + 1}</span>
                        {isCurrent && isUnlocked && (
                            <span className="user-badge current">Đọc ngay</span>
                        )}
                        {isUnlocked && !isCurrent && (
                            <span className="user-badge completed">Đã hoàn thành</span>
                        )}
                        {!isUnlocked && (
                            <span className="user-badge locked">Chưa mở khóa</span>
                        )}
                    </div>
                    <h3 className="user-card-title">{item.title}</h3>
                    <p className="user-card-desc">Chủ đề: {item.category}</p>
                    <p className="user-card-desc">Mức độ: {item.level}</p>
                    {item.images && (
                        <img src={item.images} alt={item.title} className="user-card-img" />
                    )}
                    <div className="user-card-footer">
                        {isUnlocked && isCurrent ? (
                            <Link to={`/story/${item.slug}`} className="user-btn start">
                                <i className="fas fa-book-open me-2"></i> Bắt đầu đọc
                            </Link>
                        ) : isUnlocked ? (
                            <Link to={`/story/${item.slug}`} className="user-btn review">
                                <i className="fas fa-redo"></i> Ôn lại
                            </Link>
                        ) : (
                            <button className="user-btn disabled" disabled>
                                <i className="fas fa-lock"></i> Chưa mở khóa
                            </button>
                        )}
                    </div>
                </div>
            </div>
            <div className="user-timeline-dot">
                {isUnlocked ? (
                    isCurrent ? <i className="fas fa-play-circle"></i> : <i className="fas fa-check"></i>
                ) : (
                    <i className="fas fa-lock"></i>
                )}
            </div>
        </div>
    );
}

export default StoryCard;