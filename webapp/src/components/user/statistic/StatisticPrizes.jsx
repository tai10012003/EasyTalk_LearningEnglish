import React from "react";

const StatisticPrizes = ({ prizesLoading, allPrizes, userPrizes, championStats, isPrizeUnlocked, getPrizesByType }) => {
    return (
        <div className="user-statistic-prizes">
            <h3 className="user-statistic-info-title">Giải thưởng của bạn</h3>
            {prizesLoading ? (
                <div className="user-statistic-prize-loading">
                    <i className="fas fa-spinner fa-spin"></i> Đang tải giải thưởng...
                </div>
            ) : (
                <>
                    <div className="user-statistic-prize-section">
                        <h4 className="user-statistic-prize-section-title">
                            <i className="fas fa-fire"></i> Tuần Hoàn Hảo
                            <div className="user-statistic-prize-info-icon">
                                <i className="fas fa-info-circle"></i>
                                <div className="user-statistic-prize-tooltip">
                                    <strong>Cách đạt được:</strong>
                                    <p>Học liên tục mỗi ngày không nghỉ để tích lũy streak hoàn hảo. Mỗi cấp độ yêu cầu số ngày streak khác nhau:</p>
                                    <ul>
                                        <li>Cấp 1: 7 ngày liên tiếp</li>
                                        <li>Cấp 2: 14 ngày liên tiếp</li>
                                        <li>Cấp 3: 30 ngày liên tiếp</li>
                                        <li>...</li>
                                        <li>Cấp 10: 365 ngày liên tiếp (1 năm hoàn hảo)</li>
                                    </ul>
                                    <p className="user-statistic-prize-tooltip-note">
                                        <i className="fas fa-exclamation-triangle"></i> 
                                        Chỉ cần nghỉ 1 ngày, bạn sẽ mất chuỗi hoàn hảo đó! Hãy cố gắng giữ vững chuỗi streak nhé!
                                    </p>
                                </div>
                            </div>
                        </h4>
                        <div className="user-statistic-prize-grid">
                            {getPrizesByType('perfect_streak').map((prize) => {
                                const unlocked = isPrizeUnlocked(prize.code);
                                return (
                                    <div 
                                        key={prize._id} 
                                        className={`user-statistic-prize-item ${unlocked ? 'unlocked' : 'locked'}`}
                                        title={unlocked ? `Đã đạt được: ${prize.name}` : `Chưa đạt: ${prize.name} (Cần ${prize.requirement.streakDays} ngày streak)`}
                                    >
                                        <div className="user-statistic-prize-icon">
                                            <i className={prize.iconClass}></i>
                                        </div>
                                        <div className="user-statistic-prize-info">
                                            <div className="user-statistic-prize-name">{prize.name}</div>
                                            <div className="user-statistic-prize-requirement">
                                                {prize.requirement.streakDays} ngày
                                            </div>
                                            <div className="user-statistic-prize-awards">
                                                Nhận: {prize.diamondAwards} KC
                                            </div>
                                        </div>
                                        {unlocked && (
                                            <div className="user-statistic-prize-badge">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="user-statistic-prize-section">
                        <h4 className="user-statistic-prize-section-title">
                            <i className="fas fa-graduation-cap"></i> Vị Thần Kiến Thức
                            <div className="user-statistic-prize-info-icon">
                                <i className="fas fa-info-circle"></i>
                                <div className="user-statistic-prize-tooltip">
                                    <strong>Cách đạt được:</strong>
                                    <p>Tích lũy điểm kinh nghiệm (KN) bằng cách:</p>
                                    <ul>
                                        <li>Hoàn thành bài học hàng ngày</li>
                                        <li>Làm bài tập và luyện tập</li>
                                        <li>Đạt mục tiêu flashcard mỗi ngày</li>
                                        <li>Mở khóa huy hiệu tháng</li>
                                    </ul>
                                    <p>Mỗi cấp độ yêu cầu tổng KN tích lũy:</p>
                                    <ul>
                                        <li>Cấp 1: 500 KN</li>
                                        <li>Cấp 2: 1,500 KN</li>
                                        <li>Cấp 3: 5,000 KN</li>
                                        <li>...</li>
                                        <li>Cấp 10: 100,000 KN</li>
                                    </ul>
                                    <p className="user-statistic-prize-tooltip-tip">
                                        <i className="fas fa-lightbulb"></i> 
                                        Học đều đặn mỗi ngày để tích lũy KN nhanh hơn!
                                    </p>
                                </div>
                            </div>
                        </h4>
                        <div className="user-statistic-prize-grid">
                            {getPrizesByType('knowledge_god').map((prize) => {
                                const unlocked = isPrizeUnlocked(prize.code);
                                return (
                                    <div 
                                        key={prize._id} 
                                        className={`user-statistic-prize-item ${unlocked ? 'unlocked' : 'locked'}`}
                                        title={unlocked ? `Đã đạt được: ${prize.name}` : `Chưa đạt: ${prize.name} (Cần ${prize.requirement.xp.toLocaleString()} KN)`}
                                    >
                                        <div className="user-statistic-prize-icon">
                                            <i className={prize.iconClass}></i>
                                        </div>
                                        <div className="user-statistic-prize-info">
                                            <div className="user-statistic-prize-name">{prize.name}</div>
                                            <div className="user-statistic-prize-requirement">
                                                {prize.requirement.xp.toLocaleString()} KN
                                            </div>
                                            <div className="user-statistic-prize-awards">
                                                Nhận: {prize.diamondAwards} KC
                                            </div>
                                        </div>
                                        {unlocked && (
                                            <div className="user-statistic-prize-badge">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="user-statistic-prize-section">
                        <h4 className="user-statistic-prize-section-title">
                            <i className="fas fa-crown"></i> Quán Quân Bảng Xếp Hạng
                            <div className="user-statistic-prize-info-icon">
                                <i className="fas fa-info-circle"></i>
                                <div className="user-statistic-prize-tooltip champion-tooltip">
                                    <strong>Cách đạt được:</strong>
                                    <p>Giành vị trí Top 1 trên bảng xếp hạng vào cuối kỳ. Có 3 loại giải thưởng:</p>
                                    <div className="user-statistic-prize-tooltip-champion-section">
                                        <div className="user-statistic-prize-tooltip-champion-item">
                                            <i className="fas fa-star"></i>
                                            <div>
                                                <strong>Quán Quân Tuần:</strong>
                                                <p>Đạt rank 1 vào cuối tuần (Chủ nhật) trên bảng xếp hạng KN hoặc Thời gian học</p>
                                                <p>Nhận 100 kim cương</p>
                                            </div>
                                        </div>
                                        <div className="user-statistic-prize-tooltip-champion-item">
                                            <i className="fas fa-medal"></i>
                                            <div>
                                                <strong>Quán Quân Tháng:</strong>
                                                <p>Đạt rank 1 vào cuối tháng trên bảng xếp hạng KN hoặc Thời gian học</p>
                                                <p>Nhận 500 kim cương</p>
                                            </div>
                                        </div>
                                        <div className="user-statistic-prize-tooltip-champion-item">
                                            <i className="fas fa-crown"></i>
                                            <div>
                                                <strong>Quán Quân Năm:</strong>
                                                <p>Đạt rank 1 vào cuối năm trên bảng xếp hạng KN hoặc Thời gian học</p>
                                                <p>Nhận 6500 kim cương</p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="user-statistic-prize-tooltip-note champion-note">
                                        Mỗi giải đạt được đều danh giá và phần thưởng xứng đáng! Cạnh tranh gay gắt để giành danh hiệu cao quý này!
                                    </p>
                                </div>
                            </div>
                        </h4>
                        <div className="user-statistic-prize-champion-grid">
                            {getPrizesByType('champion_week').map((prize) => {
                                const unlocked = isPrizeUnlocked(prize.code);
                                return (
                                    <div 
                                        key={prize._id} 
                                        className={`user-statistic-prize-champion ${unlocked ? 'unlocked' : 'locked'}`}
                                        title={unlocked ? `Đã đạt được: ${prize.name}` : `Chưa đạt: ${prize.name}`}
                                    >
                                        <div className="user-statistic-prize-champion-icon">
                                            <i className={prize.iconClass}></i>
                                        </div>
                                        <div className="user-statistic-prize-champion-name">{prize.name}</div>
                                        <div className="user-statistic-prize-champion-count">{championStats.week}</div>
                                        <div className="user-statistic-prize-awards">
                                            Nhận: {prize.diamondAwards} KC
                                        </div>
                                        {unlocked && (
                                            <div className="user-statistic-prize-champion-badge">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {getPrizesByType('champion_month').map((prize) => {
                                const unlocked = isPrizeUnlocked(prize.code);
                                return (
                                    <div 
                                        key={prize._id} 
                                        className={`user-statistic-prize-champion ${unlocked ? 'unlocked' : 'locked'}`}
                                        title={unlocked ? `Đã đạt được: ${prize.name}` : `Chưa đạt: ${prize.name}`}
                                    >
                                        <div className="user-statistic-prize-champion-icon">
                                            <i className={prize.iconClass}></i>
                                        </div>
                                        <div className="user-statistic-prize-champion-name">{prize.name}</div>
                                        <div className="user-statistic-prize-champion-count">{championStats.month}</div>
                                        <div className="user-statistic-prize-awards">
                                            Nhận: {prize.diamondAwards} KC
                                        </div>
                                        {unlocked && (
                                            <div className="user-statistic-prize-champion-badge">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {getPrizesByType('champion_year').map((prize) => {
                                const unlocked = isPrizeUnlocked(prize.code);
                                return (
                                    <div 
                                        key={prize._id} 
                                        className={`user-statistic-prize-champion ${unlocked ? 'unlocked' : 'locked'}`}
                                        title={unlocked ? `Đã đạt được: ${prize.name}` : `Chưa đạt: ${prize.name}`}
                                    >
                                        <div className="user-statistic-prize-champion-icon">
                                            <i className={prize.iconClass}></i>
                                        </div>
                                        <div className="user-statistic-prize-champion-name">{prize.name}</div>
                                        <div className="user-statistic-prize-champion-count">{championStats.year}</div>
                                        <div className="user-statistic-prize-awards">
                                            Nhận: {prize.diamondAwards} KC
                                        </div>
                                        {unlocked && (
                                            <div className="user-statistic-prize-champion-badge">
                                                <i className="fas fa-check-circle"></i>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StatisticPrizes;