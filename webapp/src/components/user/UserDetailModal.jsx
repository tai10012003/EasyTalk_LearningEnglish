import React, { useState, useEffect } from "react";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import { PrizeService } from "@/services/PrizeService.jsx";
import { AuthService } from '@/services/AuthService.jsx';
import StatisticChart from "@/components/user/statistic/StatisticChart";
import StatisticAchievements from "@/components/user/statistic/StatisticAchievements";
import StatisticPrizes from "@/components/user/statistic/StatisticPrizes";
import FollowListModal from "@/components/user/FollowListModal";
import Swal from "sweetalert2";

const UserDetailModal = ({ userId, username, onClose }) => {
    const [activeChart, setActiveChart] = useState("time");
    const [period, setPeriod] = useState("week");
    const [chartData, setChartData] = useState([]);
    const [streak, setStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [maxDailyExp, setMaxDailyExp] = useState(0);
    const [unlockedGates, setUnlockedGates] = useState(0);
    const [unlockedStages, setUnlockedStages] = useState(0);
    const [unlockedStory, setUnlockedStory] = useState(0);
    const [unlockedGrammar, setUnlockedGrammar] = useState(0);
    const [unlockedPronunciation, setUnlockedPronunciation] = useState(0);
    const [unlockedVocab, setUnlockedVocab] = useState(0);
    const [unlockedGrammarPractice, setUnlockedGrammarPractice] = useState(0);
    const [unlockedPronunciationPractice, setUnlockedPronunciationPractice] = useState(0);
    const [unlockedDictation, setUnlockedDictation] = useState(0);
    const [allPrizes, setAllPrizes] = useState([]);
    const [userPrizes, setUserPrizes] = useState([]);
    const [championStats, setChampionStats] = useState({ week: 0, month: 0, year: 0, total: 0 });
    const [prizesLoading, setPrizesLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [followModal, setFollowModal] = useState({ open: false, type: "followers" });
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReasons, setReportReasons] = useState({
        spam: false,
        cheating: false,
        harassment: false,
        inappropriate: false,
        other: false,
    });
    const [otherReasonText, setOtherReasonText] = useState("");
    const currentUserId = AuthService.getCurrentUser()?.id;

    const periods = [
        { key: "week", label: "Tuần này" },
        { key: "month", label: "Tháng này" },
        { key: "year", label: "Năm nay" },
    ];

    const getVNDate = (date = new Date()) => {
        const utc = date.getTime() + date.getTimezoneOffset() * 60000;
        const vnTime = utc + 7 * 60 * 60 * 1000;
        const vnDate = new Date(vnTime);
        vnDate.setHours(0, 0, 0, 0);
        return vnDate;
    };

    const formatDateString = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const fetchUserStats = async () => {
        setLoading(true);
        try {
            const progress = await UserProgressService.getUserProgressByUserId(userId);
            if (!progress) {
                Swal.fire({
                    icon: "error",
                    title: "Không tìm thấy dữ liệu",
                    text: "Không thể tải thông tin người dùng này.",
                    timer: 3000,
                });
                setLoading(false);
                return;
            }
            setCurrentUser(progress);
            setStreak(progress?.streak || 0);
            setMaxStreak(progress?.maxStreak || 0);
            const dailyExp = progress?.dailyExperiencePoints || {};
            const maxExp = Math.max(...Object.values(dailyExp).map(v => v || 0), 0);
            setMaxDailyExp(Math.round(maxExp));
            setUnlockedGates(progress?.gateDetails?.length || 0);
            setUnlockedStages(progress?.stageDetails?.length || 0);
            setUnlockedStory(progress?.storyDetails?.length || 0);
            setUnlockedGrammar(progress?.grammarDetails?.length || 0);
            setUnlockedPronunciation(progress?.pronunciationDetails?.length || 0);
            setUnlockedVocab(progress?.vocabularyExerciseDetails?.length || 0);
            setUnlockedGrammarPractice(progress?.grammarExerciseDetails?.length || 0);
            setUnlockedPronunciationPractice(progress?.pronunciationExerciseDetails?.length || 0);
            setUnlockedDictation(progress?.dictationExerciseDetails?.length || 0);
            const data = activeChart === "time" ? progress?.dailyStudyTimes || {}: dailyExp;
            const chartDataArray = Object.entries(data).map(([date, value]) => ({
                date,
                value: value || 0
            }));
            setChartData(chartDataArray);
            await fetchFollowStats();
        } catch (err) {
            console.error("Lỗi tải thông tin người dùng:", err);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể tải thông tin người dùng.",
                timer: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchPrizes = async () => {
        setPrizesLoading(true);
        try {
            const prizes = await PrizeService.getAllPrizes();
            setAllPrizes(prizes);
            const userProgress = await UserProgressService.getUserProgressByUserId(userId);
            setUserPrizes(userProgress?.unlockedPrizes || []);
            const weekCount = (userProgress?.unlockedPrizes || []).filter(p => p.code?.includes('CHAMPION_WEEK')).length;
            const monthCount = (userProgress?.unlockedPrizes || []).filter(p => p.code?.includes('CHAMPION_MONTH')).length;
            const yearCount = (userProgress?.unlockedPrizes || []).filter(p => p.code?.includes('CHAMPION_YEAR')).length;
            setChampionStats({
                week: weekCount,
                month: monthCount,
                year: yearCount,
                total: weekCount + monthCount + yearCount
            });
        } catch (err) {
            console.error("Lỗi tải giải thưởng:", err);
        } finally {
            setPrizesLoading(false);
        }
    };

    const fetchFollowStats = async () => {
        if (!userId || !currentUserId) return;
        try {
            const stats = await UserProgressService.getFollowStats(userId);
            setIsFollowing(stats.isFollowing);
            setFollowersCount(stats.followersCount);
            setFollowingCount(stats.followingCount);
        } catch (err) {
            console.error("Lỗi tải follow stats:", err);
        }
    };

    const handleFollowToggle = async () => {
        if (currentUserId === userId) {
            Swal.fire("Oops!", "Bạn không thể theo dõi chính mình!", "info");
            return;
        }
        try {
            let result;
            if (isFollowing) {
                result = await Swal.fire({
                    title: "Hủy theo dõi?",
                    text: `Bạn có chắc muốn hủy theo dõi ${username}?`,
                    icon: "question",
                    showCancelButton: true,
                    confirmButtonText: "Hủy theo dõi",
                    cancelButtonText: "Giữ lại",
                    confirmButtonColor: "#d33"
                });

                if (result.isConfirmed) {
                    const response = await UserProgressService.unfollowUser(userId);
                    if (response.alreadyUnfollowed) {
                        Swal.fire("Thông báo", "Bạn đã hủy theo dõi từ trước rồi!", "info");
                    } else {
                        setIsFollowing(false);
                        setFollowersCount(prev => prev - 1);
                        Swal.fire("Đã hủy!", `Bạn đã hủy theo dõi ${username}`, "success");
                    }
                }
            } else {
                const response = await UserProgressService.followUser(userId);
                if (response.alreadyFollowing) {
                    Swal.fire("Thông báo", `Bạn đã theo dõi ${username} từ trước rồi!`, "info");
                    setIsFollowing(true);
                } else {
                    setIsFollowing(true);
                    setFollowersCount(prev => prev + 1);
                    Swal.fire("Thành công!", `Bạn đã theo dõi ${username}! Cùng cố lên nào!`, "success");
                }
            }
        } catch (err) {
            Swal.fire("Lỗi", "Không thể thực hiện thao tác", "error");
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUserStats();
            fetchPrizes();
        }
    }, [userId]);

    const openFollowModal = (type) => {
        setFollowModal({ open: true, type });
    };

    const closeFollowModal = () => {
        setFollowModal({ open: false, type: "followers" });
    };

    const handleReportReasonChange = (reason) => {
        setReportReasons(prev => ({
            ...prev,
            [reason]: !prev[reason]
        }));
    };

    const handleSubmitReport = async () => {
        const selected = Object.keys(reportReasons).filter(key => reportReasons[key]);
        if (selected.length === 0) {
            Swal.fire("Thiếu thông tin", "Vui lòng chọn ít nhất một lý do báo cáo", "warning");
            return;
        }
        if (reportReasons.other && !otherReasonText.trim()) {
            Swal.fire("Thiếu chi tiết", "Vui lòng nhập nội dung khi chọn 'Lý do khác'", "warning");
            return;
        }
        const reportData = {
            reporter: currentUserId,
            reported: userId,
            reasons: selected,
            otherReason: reportReasons.other ? otherReasonText.trim() : null,
            status: "pending",
            createdAt: new Date().toISOString()
        };
        console.log("Gửi báo cáo:", reportData);
        Swal.fire("Gửi báo cáo thành công!", "Cảm ơn bạn đã góp phần giữ môi trường học tập trong sạch! Hệ thống sẽ kiểm tra và xử lý trong vòng 24 giờ!", "success");
        setShowReportModal(false);
        setReportReasons({
            spam: false,
            cheating: false,
            harassment: false,
            inappropriate: false,
            other: false,
        });
        setOtherReasonText("");
    };

    const getUsername = () => {
        return username;
    };

    const getEmail = () => {
        return currentUser?.userDetails?.email;
    };

    const isPrizeUnlocked = (prizeCode) => {
        return userPrizes.some(up => up.code === prizeCode);
    };

    const getPrizesByType = (type) => {
        return allPrizes.filter(p => p.type === type).sort((a, b) => a.level - b.level);
    };

    const getFullDates = () => {
        const dates = [];
        const today = getVNDate();
        if (period === "week") {
            const dayOfWeek = today.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() + diffToMonday);
            const current = new Date(startOfWeek);
            while (current <= today) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        } else if (period === "month") {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const current = new Date(startOfMonth);
            while (current <= today) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        } else if (period === "year") {
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            const current = new Date(startOfYear);
            while (current <= today) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        }
        return dates;
    };

    const getCurrentDatePlotLine = () => {
        const today = getVNDate();
        const fullDates = getFullDates();
        const index = fullDates.findIndex(date => date.getTime() === today.getTime());
        if (index === -1) return null;
        return {
            color: '#ff4d4f',
            width: 2,
            value: index,
            dashStyle: 'Dash',
            zIndex: 10
        };
    };

    const fullDates = getFullDates();

    return (
        <div className="user-detail-modal-overlay" onClick={onClose}>
            <div className="user-detail-modal-container" onClick={e => e.stopPropagation()}>
                <div className="user-detail-modal-header">
                    <h2 className="user-detail-modal-title">
                        <i className="fas fa-user-circle"></i> Thông tin chi tiết: {getUsername()}
                    </h2>
                    <button onClick={onClose} className="user-detail-modal-close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="user-detail-modal-body">
                    {loading ? (
                        <div className="user-statistic-loading">
                            <i className="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
                        </div>
                    ) : (
                        <>
                            <div className="user-statistic-info-container">
                                <h3 className="user-statistic-info-title">Thông tin cá nhân</h3>
                                <div className="user-statistic-info">
                                    <p><strong>Username:</strong> {getUsername()}</p>
                                    <p><strong>Email:</strong> {getEmail()}</p>
                                </div>
                            </div>
                            <div className="user-statistic-follow-stats">
                                <div
                                    className="user-statistic-follow-item"
                                    onClick={() => openFollowModal("followers")}
                                    style={{ cursor: "pointer" }}
                                >
                                    <strong>{followersCount}</strong> người theo dõi
                                </div>
                                <div
                                    className="user-statistic-follow-item"
                                    onClick={() => openFollowModal("following")}
                                    style={{ cursor: "pointer" }}
                                >
                                    <strong>{followingCount}</strong> người đang theo dõi
                                </div>
                            </div>
                            {currentUserId !== userId && (
                                <div className="user-statistic-follow-button-wrapper">
                                    <button 
                                        className={`user-statistic-follow-btn ${isFollowing ? "danger" : "primary"}`}
                                        onClick={handleFollowToggle}
                                    >
                                        {isFollowing ? "Hủy theo dõi" : "Theo dõi"}
                                    </button>

                                    <button
                                        className="user-statistic-follow-btn warning"
                                        onClick={() => setShowReportModal(true)}
                                    >
                                        Báo cáo
                                    </button>
                                </div>
                            )}
                            <StatisticChart
                                activeChart={activeChart}
                                period={period}
                                chartData={chartData}
                                loading={loading}
                                fullDates={fullDates}
                                formatDateString={formatDateString}
                                getCurrentDatePlotLine={getCurrentDatePlotLine}
                                onChartTypeChange={setActiveChart}
                                onPeriodChange={setPeriod}
                                periods={periods}
                                username={username}
                            />
                            <StatisticAchievements
                                streak={streak}
                                maxStreak={maxStreak}
                                currentUser={currentUser}
                                maxDailyExp={maxDailyExp}
                                unlockedGates={unlockedGates}
                                unlockedStages={unlockedStages}
                                unlockedStory={unlockedStory}
                                unlockedGrammar={unlockedGrammar}
                                unlockedPronunciation={unlockedPronunciation}
                                unlockedVocab={unlockedVocab}
                                unlockedGrammarPractice={unlockedGrammarPractice}
                                unlockedPronunciationPractice={unlockedPronunciationPractice}
                                unlockedDictation={unlockedDictation}
                                username={username}
                            />
                            <StatisticPrizes
                                prizesLoading={prizesLoading}
                                allPrizes={allPrizes}
                                userPrizes={userPrizes}
                                championStats={championStats}
                                isPrizeUnlocked={isPrizeUnlocked}
                                getPrizesByType={getPrizesByType}
                                username={username}
                            />
                            {followModal.open && (
                                <FollowListModal
                                    userId={userId}
                                    type={followModal.type}
                                    onClose={closeFollowModal}
                                    onFollowChanged={fetchFollowStats}
                                />
                            )}
                            {showReportModal && (
                                <div className="user-statistic-modal-overlay" onClick={() => setShowReportModal(false)}>
                                    <div className="user-statistic-modal" onClick={e => e.stopPropagation()}>
                                        <div className="user-statistic-modal-header bg-red-600">
                                            <h5>Báo cáo người dùng: {username}</h5>
                                            <button
                                                className="user-statistic-modal-close"
                                                onClick={() => setShowReportModal(false)}
                                            >
                                                <i className="fas fa-times"></i>
                                            </button>
                                        </div>
                                        <div className="user-statistic-modal-body" style={{ padding: "24px" }}>
                                            <p style={{ fontSize: "16px", color: "#374151", marginBottom: "20px", lineHeight: "1.6" }}>
                                                Bạn phát hiện hành vi không phù hợp?<br />
                                                Vui lòng chọn lý do để chúng tôi xử lý nhanh chóng:
                                            </p>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "15px" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={reportReasons.spam}
                                                        onChange={() => handleReportReasonChange("spam")}
                                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                                    />
                                                    <span>Quảng cáo hoặc spam không liên quan đến việc học</span>
                                                </label>
                                                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "15px" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={reportReasons.cheating}
                                                        onChange={() => handleReportReasonChange("cheating")}
                                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                                    />
                                                    <span>Gian lận điểm số, dùng tool hack EXP/streak</span>
                                                </label>
                                                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "15px" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={reportReasons.harassment}
                                                        onChange={() => handleReportReasonChange("harassment")}
                                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                                    />
                                                    <span>Ngôn ngữ xúc phạm, quấy rối người học khác</span>
                                                </label>
                                                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "15px" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={reportReasons.inappropriate}
                                                        onChange={() => handleReportReasonChange("inappropriate")}
                                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                                    />
                                                    <span>Nội dung không phù hợp với môi trường học tập (18+, bạo lực...)</span>
                                                </label>
                                                <label style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer", fontSize: "15px" }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={reportReasons.other}
                                                        onChange={() => handleReportReasonChange("other")}
                                                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                                                    />
                                                    <span>Lý do khác</span>
                                                </label>
                                            </div>
                                            {reportReasons.other && (
                                                <div style={{ marginTop: "20px" }}>
                                                    <textarea
                                                        placeholder="Mô tả chi tiết hành vi vi phạm (ví dụ: dùng bot tăng điểm, gửi link lừa đảo...)"
                                                        value={otherReasonText}
                                                        onChange={e => setOtherReasonText(e.target.value)}
                                                        style={{
                                                            width: "100%",
                                                            padding: "14px",
                                                            borderRadius: "10px",
                                                            border: "2px solid #e5e7eb",
                                                            fontSize: "15px",
                                                            resize: "vertical",
                                                            minHeight: "100px",
                                                            fontFamily: "inherit",
                                                            outline: "none"
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="user-statistic-modal-footer" style={{ padding: "20px 24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                                            <button
                                                className="user-statistic-btn secondary"
                                                style={{
                                                    padding: "10px 20px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #ccc",
                                                    backgroundColor: "#f8f9fa",
                                                    cursor: "pointer",
                                                    fontWeight: "500"
                                                }}
                                                onClick={() => {
                                                    setShowReportModal(false);
                                                    setReportReasons({
                                                        spam: false,
                                                        cheating: false,
                                                        harassment: false,
                                                        inappropriate: false,
                                                        other: false,
                                                    });
                                                    setOtherReasonText("");
                                                }}
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                className="user-statistic-btn danger"
                                                style={{
                                                    padding: "10px 28px",
                                                    borderRadius: "8px",
                                                    border: "none",
                                                    backgroundColor: "#e74c3c",
                                                    color: "white",
                                                    cursor: "pointer",
                                                    fontWeight: "600"
                                                }}
                                                onClick={handleSubmitReport}
                                            >
                                                Gửi báo cáo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDetailModal;