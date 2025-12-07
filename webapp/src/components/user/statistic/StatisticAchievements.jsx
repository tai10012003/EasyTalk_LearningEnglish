import React from "react";
import { useNavigate } from "react-router-dom";

const StatisticAchievements = ({ streak, maxStreak, currentUser, maxDailyExp, unlockedGates, unlockedStages, unlockedGrammar, unlockedPronunciation, unlockedVocab, unlockedGrammarPractice, unlockedPronunciationPractice, unlockedDictation }) => {
    const navigate = useNavigate();

    return (
        <div className="user-statistic-achievements">
            <h3 className="user-statistic-info-title">Thành tích của bạn</h3>
            <div className="user-statistic-achievement-grid">
                <div className="user-statistic-card" onClick={() => navigate('/streak')} style={{ cursor: 'pointer' }}>
                    <div className="user-statistic-icon fire">
                        <i className="fas fa-fire"></i>
                    </div>
                    <div className="user-statistic-info">
                        <div className="user-statistic-label">Streak hiện tại</div>
                        <div className="user-statistic-value">{streak} ngày</div>
                    </div>
                </div>
                <div className="user-statistic-card record" onClick={() => navigate('/streak')} style={{ cursor: 'pointer' }}>
                    <div className="user-statistic-icon trophy">
                        <i className="fas fa-trophy"></i>
                    </div>
                    <div className="user-statistic-info">
                        <div className="user-statistic-label">Kỷ lục streak</div>
                        <div className="user-statistic-value">{maxStreak} ngày</div>
                    </div>
                </div>
                <div className="user-statistic-card">
                    <div className="user-statistic-icon exp">
                        <i className="fas fa-star"></i>
                    </div>
                    <div className="user-statistic-info">
                        <div className="user-statistic-label">Điểm KN hiện tại</div>
                        <div className="user-statistic-value">{(currentUser?.experiencePoints || 0).toLocaleString()} KN</div>
                    </div>
                </div>
                <div className="user-statistic-card record-exp">
                    <div className="user-statistic-icon record-exp-icon">
                        <i className="fas fa-bolt"></i>
                    </div>
                    <div className="user-statistic-info">
                        <div className="user-statistic-label">Kỷ lục KN/ngày</div>
                        <div className="user-statistic-value">{maxDailyExp} KN</div>
                    </div>
                </div>
            </div>
            <div className="user-statistic-unlocked-container">
                <div className="user-statistic-unlocked-grid">
                    <div className="user-statistic-unlocked-item">
                        <i className="fas fa-door-open"></i>
                        <div>
                            <div className="user-statistic-unlocked-label">Số cổng</div>
                            <div className="user-statistic-unlocked-value">{unlockedGates} cổng</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item">
                        <i className="fas fa-route"></i>
                        <div>
                            <div className="user-statistic-unlocked-label">Số chặng</div>
                            <div className="user-statistic-unlocked-value">{unlockedStages} chặng</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item">
                        <i className="fas fa-book"></i>
                        <div>
                            <div className="user-statistic-unlocked-label">Bài học ngữ pháp</div>
                            <div className="user-statistic-unlocked-value">{unlockedGrammar} bài</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item">
                        <i className="fas fa-microphone"></i>
                        <div>
                            <div className="user-statistic-unlocked-label">Bài học phát âm</div>
                            <div className="user-statistic-unlocked-value">{unlockedPronunciation} bài</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item">
                        <i className="fas fa-dumbbell"></i>
                        <div>
                            <div className="user-statistic-unlocked-label">Luyện từ vựng</div>
                            <div className="user-statistic-unlocked-value">{unlockedVocab} bài</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item">
                        <i className="fas fa-pencil-alt"></i>
                        <div>
                            <div className="user-statistic-unlocked-label">Luyện ngữ pháp</div>
                            <div className="user-statistic-unlocked-value">{unlockedGrammarPractice} bài</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item">
                        <i className="fas fa-microphone"></i>
                        <div>
                            <div className="user-statistic-unlocked-label">Luyện phát âm</div>
                            <div className="user-statistic-unlocked-value">{unlockedPronunciationPractice} bài</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item">
                        <i className="fas fa-headphones"></i>
                        <div>
                            <div className="user-statistic-unlocked-label">Luyện Nghe chép chính tả</div>
                            <div className="user-statistic-unlocked-value">{unlockedDictation} bài</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatisticAchievements;