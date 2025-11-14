import React, { useState, useEffect } from "react";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const LeaderBoard = () => {
    const [activeTab, setActiveTab] = useState("exp");
    const [activePeriod, setActivePeriod] = useState("all");
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);

    const periods = [
        { key: "all", label: "Tổng" },
        { key: "week", label: "Tuần" },
        { key: "month", label: "Tháng" },
        { key: "year", label: "Năm" }
    ];

    const tabs = [
        { key: "exp", label: "Điểm Kinh Nghiệm", icon: "trophy" },
        { key: "time", label: "Thời Gian Học", icon: "clock" },
        { key: "streak", label: "Số Streak", icon: "fire" }
    ];

    const weeklyRewards = [
        { rank: 1, prize: "500.000 VNĐ + Huy hiệu Vàng + 10.000 KN", desc: "Vô địch tuần – Tiền mặt + vinh danh toàn server!", icon: "crown", color: "from-yellow-400 to-amber-600" },
        { rank: 2, prize: "300.000 VNĐ + Huy hiệu Bạc + 5.000 KN", desc: "Á quân xuất sắc!", icon: "medal", color: "from-gray-300 to-gray-500" },
        { rank: 3, prize: "100.000 VNĐ + Huy hiệu Đồng + 2.000 KN", desc: "Top 3 kiên trì!", icon: "award", color: "from-orange-600 to-red-700" }
    ];

    const monthlyRewards = [
        { rank: 1, prize: "5.000.000 VNĐ + MacBook Air M3 + 50.000 KN", desc: "VUA THÁNG – Siêu phẩm công nghệ + tiền mặt khủng!", icon: "diamond", color: "from-purple-500 to-pink-600" },
        { rank: 2, prize: "2.000.000 VNĐ + iPad Pro + 20.000 KN", desc: "Á quân tháng – Vẫn cực đỉnh!", icon: "gem", color: "from-blue-400 to-cyan-500" },
        { rank: 3, prize: "1.000.000 VNĐ + AirPods Pro 3 + 10.000 KN", desc: "Top 3 tháng – Phần thưởng chất!", icon: "star", color: "from-green-400 to-teal-600" }
    ];

    const yearlyRewards = [
        { rank: 1, prize: "50.000.000 VNĐ + iPhone 17 Pro Max + Du lịch Singapore 5 sao 5N4Đ", desc: "HOÀNG ĐẾ NĂM – Huyền thoại EasyTalk 2025!", icon: "trophy", color: "from-red-600 to-rose-700" },
        { rank: 2, prize: "20.000.000 VNĐ + MacBook Pro M4 + Du lịch Đà Nẵng 4N3Đ", desc: "Huyền thoại thứ 2 – Vẫn vô địch!", icon: "crown", color: "from-indigo-600 to-purple-700" },
        { rank: 3, prize: "10.000.000 VNĐ + iPad Pro + Apple Watch Ultra 3", desc: "Top 3 năm – Siêu sao bất bại!", icon: "shield", color: "from-emerald-500 to-teal-700" }
    ];

    const getCurrentRewards = () => {
        if (activePeriod == "week") return weeklyRewards;
        if (activePeriod == "month") return monthlyRewards;
        if (activePeriod == "year") return yearlyRewards;
        return [];
    };

    const getPeriodTitle = () => {
        if (activePeriod == "week") return "TUẦN NÀY";
        if (activePeriod == "month") return "THÁNG NÀY";
        if (activePeriod == "year") return "NĂM 2025";
        return "";
    };

    const getPeriodRangeText = () => {
        const now = new Date();
        let start, end;
        if (activePeriod == "week") {
            const day = now.getDay();
            const diff = now.getDate() - day + (day == 0 ? -6 : 1);
            start = new Date(now);
            start.setDate(diff);
            end = new Date(start);
            end.setDate(start.getDate() + 6);
        } else if (activePeriod == "month") {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (activePeriod == "year") {
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
        } else {
            return null;
        }
        const format = (date) => date.toLocaleDateString("vi-VN");
        return `Từ ${format(start)} đến ${format(end)}`;
    };

    const fetchLeaderboard = async () => {
        document.title = "Bảng Xếp Hạng - EasyTalk";
        setLoading(true);
        try {
            const data = await UserProgressService.getLeaderboard(activeTab, activePeriod, 50);
            setLeaderboard(data || []);
            try {
                const userProgress = await UserProgressService.getCurrentUserProgress();
                setCurrentUser(userProgress);
            } catch (err) {
                setCurrentUser(null);
            }
        } catch (err) {
            console.error("Lỗi tải bảng xếp hạng:", err);
            setLeaderboard([]);
            Swal.fire({
                icon: "warning",
                title: "Tạm thời không tải được bảng xếp hạng",
                text: "Vui lòng thử lại sau ít phút.",
                timer: 3000,
                showConfirmButton: false
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [activeTab, activePeriod]);

    const formatTime = (hours) => {
        if (!hours || hours < 0.01) return "0 phút";
        if (hours < 1) return `${Math.round(hours * 60)} phút`;
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${h} giờ${m > 0 ? ` ${m} phút` : ""}`;
    };

    const isCurrentUser = (username) => {
        if (!currentUser) return false;
        if (currentUser.userDetails?.username == username) return true;
        const currentUsername = currentUser.userDetails?.username || AuthService.getCurrentUser()?.username;
        return currentUsername == username;
    };

    const getCurrentUsername = () => {
        if (currentUser?.userDetails?.username) return currentUser.userDetails.username;
        return AuthService.getCurrentUser()?.username || "Unknown";
    };

    const getValueDisplay = (item) => {
        if (activeTab == "exp") return `${Math.round(item.value).toLocaleString()} KN`;
        if (activeTab == "time") return formatTime(item.value);
        if (activeTab == "streak") return `${item.streak || 0} ngày`;
        return "-";
    };

    const periodRangeText = getPeriodRangeText();
    const currentRewards = getCurrentRewards();

    return (
        <div className="user-leaderboard-container container">
            <div className="user-leaderboard-header">
                <h2 className="user-leaderboard-title">BẢNG XẾP HẠNG EASYTALK</h2>
                {/* <p className="text-2xl text-gray-700 font-bold bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent">
                    Top 1 năm 2025 nhận <strong>50 TRIỆU + iPhone 17 Pro Max + Singapore 5 sao!</strong>
                </p> */}
            </div>
            <div className="user-leaderboard-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`user-leaderboard-tab ${activeTab == tab.key ? "active" : ""}`}
                        onClick={() => {
                            setActiveTab(tab.key);
                            if (tab.key == "streak") setActivePeriod("all");
                        }}
                    >
                        <i className={`fas fa-${tab.icon}`}></i> {tab.label}
                    </button>
                ))}
            </div>
            {activeTab !== "streak" && (
                <>
                    <div className="user-leaderboard-periods">
                        {periods.map(p => (
                            <button
                                key={p.key}
                                className={`user-leaderboard-period ${activePeriod == p.key ? "active" : ""}`}
                                onClick={() => setActivePeriod(p.key)}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                    {activePeriod !== "all" && periodRangeText && (
                        <div className="user-leaderboard-period-range">
                            <i className="fas fa-calendar-alt"></i> {periodRangeText}
                        </div>
                    )}
                    {/* {activePeriod !== "all" && currentRewards.length > 0 && (
                        <div className="user-leaderboard-rewards">
                            <div className="rewards-title">
                                <i className="fas fa-gift"></i> PHẦN THƯỞNG {getPeriodTitle()}
                            </div>
                            <div className="rewards-grid">
                                {currentRewards.map((reward) => (
                                    <div key={reward.rank} className="reward-card">
                                        <div className={`reward-rank rank-${reward.rank}`}>
                                            <i className={`fas fa-${reward.icon}`}></i>
                                            <span>TOP {reward.rank}</span>
                                        </div>
                                        <div className="reward-prize">{reward.prize}</div>
                                        <div className="reward-desc">{reward.desc}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="rewards-note">
                                {activePeriod == "week" && "Phần thưởng trao vào Chủ Nhật 23:59 hàng tuần"}
                                {activePeriod == "month" && "Phần thưởng trao vào ngày cuối tháng"}
                                {activePeriod == "year" && "Phần thưởng trao vào 31/12/2025 – Gala EasyTalk 2025 tại Hà Nội"}
                            </div>
                        </div>
                    )} */}
                </>
            )}
            <div className="user-leaderboard-table-container">
                {loading ? (
                    <div className="user-leaderboard-loading">
                        <i className="fas fa-spinner fa-spin"></i> Đang tải bảng xếp hạng...
                    </div>
                ) : leaderboard.length == 0 ? (
                    <div className="user-leaderboard-empty">
                        <i className="fas fa-trophy fa-3x"></i>
                        <p>Chưa có dữ liệu xếp hạng</p>
                        <small>Học ngay để lên Top nào!</small>
                    </div>
                ) : (
                    <table className="user-leaderboard-table">
                        <thead>
                            <tr>
                                <th>Hạng</th>
                                <th>Người chơi</th>
                                <th>
                                    {activeTab == "exp" && "Điểm KN"}
                                    {activeTab == "time" && "Thời gian học"}
                                    {activeTab == "streak" && "Streak hiện tại"}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderboard.map((item, idx) => (
                                <tr
                                    key={item._id || idx}
                                    className={`user-leaderboard-row 
                                        ${isCurrentUser(item.username) ? "current-user" : ""}
                                        ${idx < 3 ? "top-3" : ""}`}
                                >
                                    <td className="user-leaderboard-rank">
                                        {idx < 3 ? (
                                            <div className={`rank-medal rank-${idx + 1}`}>
                                                <i className="fas fa-medal"></i>
                                            </div>
                                        ) : (
                                            <span className="rank-number">{idx + 1}</span>
                                        )}
                                    </td>
                                    <td className="user-leaderboard-username">
                                        <span className="username-text">{item.username}</span>
                                        {isCurrentUser(item.username) && (
                                            <span className="current-user-badge">Bạn</span>
                                        )}
                                    </td>
                                    <td className="user-leaderboard-value">
                                        {getValueDisplay(item)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            {currentUser && !loading && leaderboard.length > 0 && !leaderboard.some(u => isCurrentUser(u.username)) && (
                <div className="user-leaderboard-your-rank">
                    <strong>Bạn:</strong> {getCurrentUsername()} - 
                    {" "} {activeTab == "exp" && `${currentUser.experiencePoints || 0} KN`}
                    {activeTab == "time" && ` ${formatTime(currentUser.studyTimes || 0)}`}
                    {activeTab == "streak" && ` ${currentUser.streak || 0} ngày liên tiếp`}
                </div>
            )}
        </div>
    );
};

export default LeaderBoard;