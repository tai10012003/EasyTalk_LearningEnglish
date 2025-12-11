import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const StatisticAchievements = ({ streak, maxStreak, currentUser, maxDailyExp, unlockedGates, unlockedStages, unlockedStory, unlockedGrammar, unlockedPronunciation, unlockedVocab, unlockedGrammarPractice, unlockedPronunciationPractice, unlockedDictation, username = null }) => {
    const navigate = useNavigate();
    const isOwnStats = !username;
    const title = isOwnStats ? "Thành tích của bạn" : `Thành tích của ${username}`;
    const [showGateModal, setShowGateModal] = useState(false);
    const [showStageModal, setShowStageModal] = useState(false);
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [showGrammarModal, setShowGrammarModal] = useState(false);
    const [showPronunciationModal, setShowPronunciationModal] = useState(false);
    const [showVocabModal, setShowVocabModal] = useState(false);
    const [showGrammarPracticeModal, setShowGrammarPracticeModal] = useState(false);
    const [showPronunciationPracticeModal, setShowPronunciationPracticeModal] = useState(false);
    const [showDictationModal, setShowDictationModal] = useState(false);
    const gateDetails = currentUser?.gateDetails || [];
    const stageDetails = currentUser?.stageDetails || [];
    const storyDetails = currentUser?.storyDetails || [];
    const grammarDetails = currentUser?.grammarDetails || [];
    const pronunciationDetails = currentUser?.pronunciationDetails || [];
    const vocabularyDetails = currentUser?.vocabularyExerciseDetails || [];
    const grammarExerciseDetails = currentUser?.grammarExerciseDetails || [];
    const pronunciationExerciseDetails = currentUser?.pronunciationExerciseDetails || [];
    const dictationDetails = currentUser?.dictationExerciseDetails || [];
    
    const formatGateName = (gate) => `${gate.name || gate.title || "Cổng không tên"}`;
    const formatStageName = (stage) => `${stage.name || stage.title || "Chặng không tên"}`;
    const formatLessonName = (item) => item.title || item.name || "Bài không tên";

    return (
        <div className="user-statistic-achievements">
            <h3 className="user-statistic-info-title">{title}</h3>
            <div className="user-statistic-achievement-grid">
                <div 
                    className="user-statistic-card" 
                    onClick={() => isOwnStats && navigate('/streak')} 
                    style={{ cursor: isOwnStats ? 'pointer' : 'default' }}
                >
                    <div className="user-statistic-icon fire">
                        <i className="fas fa-fire"></i>
                    </div>
                    <div className="user-statistic-info">
                        <div className="user-statistic-label">Streak hiện tại</div>
                        <div className="user-statistic-value">{streak} ngày</div>
                    </div>
                </div>
                <div 
                    className="user-statistic-card record" 
                    onClick={() => isOwnStats && navigate('/streak')} 
                    style={{ cursor: isOwnStats ? 'pointer' : 'default' }}
                >
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
                    <div className="user-statistic-unlocked-item"
                        onClick={() => setShowGateModal(true)} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-door-open"></i>
                        <div className="mt-2">
                            <div className="user-statistic-unlocked-label">Số cổng</div>
                            <div className="user-statistic-unlocked-value">{unlockedGates} cổng</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item"
                        onClick={() => setShowStageModal(true)} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-route"></i>
                        <div className="mt-2">
                            <div className="user-statistic-unlocked-label">Số chặng</div>
                            <div className="user-statistic-unlocked-value">{unlockedStages} chặng</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item"
                        onClick={() => setShowStoryModal(true)} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-book-open"></i>
                        <div className="mt-2">
                            <div className="user-statistic-unlocked-label">Bài học câu chuyện</div>
                            <div className="user-statistic-unlocked-value">{unlockedStory} bài</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item"
                        onClick={() => setShowGrammarModal(true)} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-book"></i>
                        <div className="mt-2">
                            <div className="user-statistic-unlocked-label">Bài học ngữ pháp</div>
                            <div className="user-statistic-unlocked-value">{unlockedGrammar} bài</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item"
                        onClick={() => setShowPronunciationModal(true)} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-microphone"></i>
                        <div className="mt-2">
                            <div className="user-statistic-unlocked-label">Bài học phát âm</div>
                            <div className="user-statistic-unlocked-value">{unlockedPronunciation} bài</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item"
                        onClick={() => setShowGrammarPracticeModal(true)} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-pencil-alt"></i>
                        <div className="mt-2">
                            <div className="user-statistic-unlocked-label">Luyện ngữ pháp</div>
                            <div className="user-statistic-unlocked-value">{unlockedGrammarPractice} bài</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item"
                        onClick={() => setShowPronunciationPracticeModal(true)} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-microphone"></i>
                        <div className="mt-2">
                            <div className="user-statistic-unlocked-label">Luyện phát âm</div>
                            <div className="user-statistic-unlocked-value">{unlockedPronunciationPractice} bài</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item"
                        onClick={() => setShowVocabModal(true)} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-dumbbell"></i>
                        <div className="mt-2">
                            <div className="user-statistic-unlocked-label">Luyện từ vựng</div>
                            <div className="user-statistic-unlocked-value">{unlockedVocab} bài</div>
                        </div>
                    </div>
                    <div className="user-statistic-unlocked-item"
                        onClick={() => setShowDictationModal(true)} style={{ cursor: 'pointer' }}>
                        <i className="fas fa-headphones"></i>
                        <div className="mt-2">
                            <div className="user-statistic-unlocked-label">Luyện Nghe chép chính tả</div>
                            <div className="user-statistic-unlocked-value">{unlockedDictation} bài</div>
                        </div>
                    </div>
                </div>
            </div>
            {showGateModal && (
                <div className="user-statistic-modal-overlay" onClick={() => setShowGateModal(false)}>
                    <div className="user-statistic-modal" onClick={e => e.stopPropagation()}>
                        <div className="user-statistic-modal-header bg-purple-600">
                            <h5>Cổng Đã Mở Khóa ({unlockedGates})</h5>
                            <button onClick={() => setShowGateModal(false)} className="user-statistic-modal-close">×</button>
                        </div>
                        <div className="user-statistic-modal-body">
                            {gateDetails.length == 0 ? (
                                <p className="text-center text-gray-500 py-12 text-lg">Chưa mở khóa cổng nào</p>
                            ) : (
                                <div className="user-statistic-card-list">
                                    {gateDetails.map((gate, index) => (
                                        <div key={index} className="user-statistic-card-item">
                                            <div className="user-statistic-card-icon text-purple-600">
                                                <i className="fas fa-door-open fa-2x"></i>
                                            </div>
                                            <div className="user-statistic-card-info">
                                                <div className="font-bold text-lg text-purple-800">
                                                    {formatGateName(gate)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="user-statistic-modal-footer">
                            <button onClick={() => setShowGateModal(false)} className="user-statistic-modal-btn">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showStageModal && (
                <div className="user-statistic-modal-overlay" onClick={() => setShowStageModal(false)}>
                    <div className="user-statistic-modal" onClick={e => e.stopPropagation()}>
                        <div className="user-statistic-modal-header bg-indigo-600">
                            <h5>Chặng Đã Mở Khóa ({unlockedStages})</h5>
                            <button onClick={() => setShowStageModal(false)} className="user-statistic-modal-close">×</button>
                        </div>
                        <div className="user-statistic-modal-body">
                            {stageDetails.length == 0 ? (
                                <p className="text-center text-gray-500 py-12 text-lg">Chưa mở khóa chặng nào</p>
                            ) : (
                                <div className="user-statistic-card-list">
                                    {stageDetails.map((stage, index) => (
                                        <div key={index} className="user-statistic-card-item">
                                            <div className="user-statistic-card-icon text-indigo-600">
                                                <i className="fas fa-route fa-2x"></i>
                                            </div>
                                            <div className="user-statistic-card-info">
                                                <div className="font-bold text-lg text-indigo-800">
                                                    {formatStageName(stage)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="user-statistic-modal-footer">
                            <button onClick={() => setShowStageModal(false)} className="user-statistic-modal-btn">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showStoryModal && (
                <div className="user-statistic-modal-overlay" onClick={() => setShowStoryModal(false)}>
                    <div className="user-statistic-modal" onClick={e => e.stopPropagation()}>
                        <div className="user-statistic-modal-header bg-green-600">
                            <h5>Bài Học Câu Chuyện Đã Hoàn Thành ({unlockedStory})</h5>
                            <button onClick={() => setShowStoryModal(false)} className="user-statistic-modal-close">×</button>
                        </div>
                        <div className="user-statistic-modal-body">
                            {storyDetails.length == 0 ? (
                                <p className="text-center text-gray-500 py-12 text-lg">Chưa hoàn thành bài câu chuyện nào</p>
                            ) : (
                                <div className="user-statistic-card-list">
                                    {storyDetails.map((item, index) => (
                                        <div key={index} className="user-statistic-card-item">
                                            <div className="user-statistic-card-icon text-green-600">
                                                <i className="fas fa-book-open fa-2x"></i>
                                            </div>
                                            <div className="user-statistic-card-info">
                                                <div className="font-bold text-lg text-green-800">
                                                    {formatLessonName(item)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="user-statistic-modal-footer">
                            <button onClick={() => setShowStoryModal(false)} className="user-statistic-modal-btn">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showGrammarModal && (
                <div className="user-statistic-modal-overlay" onClick={() => setShowGrammarModal(false)}>
                    <div className="user-statistic-modal" onClick={e => e.stopPropagation()}>
                        <div className="user-statistic-modal-header bg-green-600">
                            <h5>Bài Học Ngữ Pháp Đã Hoàn Thành ({unlockedGrammar})</h5>
                            <button onClick={() => setShowGrammarModal(false)} className="user-statistic-modal-close">×</button>
                        </div>
                        <div className="user-statistic-modal-body">
                            {grammarDetails.length == 0 ? (
                                <p className="text-center text-gray-500 py-12 text-lg">Chưa hoàn thành bài ngữ pháp nào</p>
                            ) : (
                                <div className="user-statistic-card-list">
                                    {grammarDetails.map((item, index) => (
                                        <div key={index} className="user-statistic-card-item">
                                            <div className="user-statistic-card-icon text-green-600">
                                                <i className="fas fa-book fa-2x"></i>
                                            </div>
                                            <div className="user-statistic-card-info">
                                                <div className="font-bold text-lg text-green-800">
                                                    {formatLessonName(item)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="user-statistic-modal-footer">
                            <button onClick={() => setShowGrammarModal(false)} className="user-statistic-modal-btn">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showPronunciationModal && (
                <div className="user-statistic-modal-overlay" onClick={() => setShowPronunciationModal(false)}>
                    <div className="user-statistic-modal" onClick={e => e.stopPropagation()}>
                        <div className="user-statistic-modal-header bg-blue-600">
                            <h5>Bài Học Phát Âm Đã Hoàn Thành ({unlockedPronunciation})</h5>
                            <button onClick={() => setShowPronunciationModal(false)} className="user-statistic-modal-close">×</button>
                        </div>
                        <div className="user-statistic-modal-body">
                            {pronunciationDetails.length === 0 ? (
                                <p className="text-center text-gray-500 py-12 text-lg">Chưa hoàn thành bài phát âm nào</p>
                            ) : (
                                <div className="user-statistic-card-list">
                                    {pronunciationDetails.map((item, index) => (
                                        <div key={index} className="user-statistic-card-item">
                                            <div className="user-statistic-card-icon text-blue-600">
                                                <i className="fas fa-microphone fa-2x"></i>
                                            </div>
                                            <div className="user-statistic-card-info">
                                                <div className="font-bold text-lg text-blue-800">
                                                    {formatLessonName(item)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="user-statistic-modal-footer">
                            <button onClick={() => setShowPronunciationModal(false)} className="user-statistic-modal-btn">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showGrammarPracticeModal && (
                <div className="user-statistic-modal-overlay" onClick={() => setShowGrammarPracticeModal(false)}>
                    <div className="user-statistic-modal" onClick={e => e.stopPropagation()}>
                        <div className="user-statistic-modal-header bg-pink-600">
                            <h5>Luyện Ngữ Pháp Đã Hoàn Thành ({unlockedGrammarPractice})</h5>
                            <button onClick={() => setShowGrammarPracticeModal(false)} className="user-statistic-modal-close">×</button>
                        </div>
                        <div className="user-statistic-modal-body">
                            {grammarExerciseDetails.length === 0 ? (
                                <p className="text-center text-gray-500 py-12 text-lg">Chưa luyện ngữ pháp nào</p>
                            ) : (
                                <div className="user-statistic-card-list">
                                    {grammarExerciseDetails.map((item, index) => (
                                        <div key={index} className="user-statistic-card-item">
                                            <div className="user-statistic-card-icon text-pink-600">
                                                <i className="fas fa-pencil-alt fa-2x"></i>
                                            </div>
                                            <div className="user-statistic-card-info">
                                                <div className="font-bold text-lg text-pink-800">
                                                    {formatLessonName(item)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="user-statistic-modal-footer">
                            <button onClick={() => setShowGrammarPracticeModal(false)} className="user-statistic-modal-btn">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showPronunciationPracticeModal && (
                <div className="user-statistic-modal-overlay" onClick={() => setShowPronunciationPracticeModal(false)}>
                    <div className="user-statistic-modal" onClick={e => e.stopPropagation()}>
                        <div className="user-statistic-modal-header bg-teal-600">
                            <h5>Luyện Phát Âm Đã Hoàn Thành ({unlockedPronunciationPractice})</h5>
                            <button onClick={() => setShowPronunciationPracticeModal(false)} className="user-statistic-modal-close">×</button>
                        </div>
                        <div className="user-statistic-modal-body">
                            {pronunciationExerciseDetails.length == 0 ? (
                                <p className="text-center text-gray-500 py-12 text-lg">Chưa luyện phát âm nào</p>
                            ) : (
                                <div className="user-statistic-card-list">
                                    {pronunciationExerciseDetails.map((item, index) => (
                                        <div key={index} className="user-statistic-card-item">
                                            <div className="user-statistic-card-icon text-teal-600">
                                                <i className="fas fa-microphone fa-2x"></i>
                                            </div>
                                            <div className="user-statistic-card-info">
                                                <div className="font-bold text-lg text-teal-800">
                                                    {formatLessonName(item)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="user-statistic-modal-footer">
                            <button onClick={() => setShowPronunciationPracticeModal(false)} className="user-statistic-modal-btn">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showVocabModal && (
                <div className="user-statistic-modal-overlay" onClick={() => setShowVocabModal(false)}>
                    <div className="user-statistic-modal" onClick={e => e.stopPropagation()}>
                        <div className="user-statistic-modal-header bg-orange-600">
                            <h5>Luyện Từ Vựng Đã Hoàn Thành ({unlockedVocab})</h5>
                            <button onClick={() => setShowVocabModal(false)} className="user-statistic-modal-close">×</button>
                        </div>
                        <div className="user-statistic-modal-body">
                            {vocabularyDetails.length === 0 ? (
                                <p className="text-center text-gray-500 py-12 text-lg">Chưa luyện từ vựng nào</p>
                            ) : (
                                <div className="user-statistic-card-list">
                                    {vocabularyDetails.map((item, index) => (
                                        <div key={index} className="user-statistic-card-item">
                                            <div className="user-statistic-card-icon text-orange-600">
                                                <i className="fas fa-dumbbell fa-2x"></i>
                                            </div>
                                            <div className="user-statistic-card-info">
                                                <div className="font-bold text-lg text-orange-800">
                                                    {formatLessonName(item)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="user-statistic-modal-footer">
                            <button onClick={() => setShowVocabModal(false)} className="user-statistic-modal-btn">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showDictationModal && (
                <div className="user-statistic-modal-overlay" onClick={() => setShowDictationModal(false)}>
                    <div className="user-statistic-modal" onClick={e => e.stopPropagation()}>
                        <div className="user-statistic-modal-header bg-red-600">
                            <h5>Luyện Nghe Chép Chính Tả Đã Hoàn Thành ({unlockedDictation})</h5>
                            <button onClick={() => setShowDictationModal(false)} className="user-statistic-modal-close">×</button>
                        </div>
                        <div className="user-statistic-modal-body">
                            {dictationDetails.length == 0 ? (
                                <p className="text-center text-gray-500 py-12 text-lg">Chưa luyện nghe chép chính tả nào</p>
                            ) : (
                                <div className="user-statistic-card-list">
                                    {dictationDetails.map((item, index) => (
                                        <div key={index} className="user-statistic-card-item">
                                            <div className="user-statistic-card-icon text-red-600">
                                                <i className="fas fa-headphones fa-2x"></i>
                                            </div>
                                            <div className="user-statistic-card-info">
                                                <div className="font-bold text-lg text-red-800">
                                                    {formatLessonName(item)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="user-statistic-modal-footer">
                            <button onClick={() => setShowDictationModal(false)} className="user-statistic-modal-btn">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatisticAchievements;