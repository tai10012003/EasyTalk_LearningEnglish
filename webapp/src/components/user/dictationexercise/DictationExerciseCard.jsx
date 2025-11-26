import React from 'react';
import { Link } from 'react-router-dom';

const DictationExerciseCard = ({ item, index, isUnlocked, isCurrent }) => {
    return (
        <div className={`user-timeline-item ${index % 2 === 0 ? 'left' : 'right'} ${isUnlocked ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}`}>
            <div className="user-timeline-card">
                <div className="user-card-inner">
                    <div className="user-card-header">
                        <span className="user-step-badge">Bước {index + 1}</span>
                        {isCurrent && isUnlocked && (
                            <span className="user-badge current">Luyện tập ngay</span>
                        )}
                        {isUnlocked && !isCurrent && (
                            <span className="user-badge completed">Đã hoàn thành</span>
                        )}
                        {!isUnlocked && (
                            <span className="user-badge locked">Chưa mở khóa</span>
                        )}
                    </div>
                    <h3 className="user-card-title">{item.title}</h3>
                    <p className="user-card-desc">
                        Số câu: {item.content ? item.content.split('.').length : 0}
                    </p>
                    <div className="user-card-footer">
                        {isUnlocked && isCurrent ? (
                            <Link to={`/dictation-exercise/${item.slug}`} className="user-btn start">
                                <i className="fas fa-pen me-2"></i> Bắt đầu luyện tập
                            </Link>
                        ) : isUnlocked ? (
                            <Link to={`/dictation-exercise/${item.slug}`} className="user-btn review">
                                <i className="fas fa-redo"></i> Làm lại
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

export default DictationExerciseCard;