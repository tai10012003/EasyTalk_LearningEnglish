import React, { useState, useEffect } from "react";
import UserDetailModal from "@/components/user/UserDetailModal";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const LeaderBoard = () => {
    const [activeTab, setActiveTab] = useState("exp");
    const [activePeriod, setActivePeriod] = useState("all");
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedUsername, setSelectedUsername] = useState("");

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

    const handleUserClick = (item) => {
        const userId = item.userId || item._id || item.user;
        const userIdString = typeof userId === 'object' && userId.$oid ? userId.$oid : (userId.toString ? userId.toString() : String(userId));
        setSelectedUserId(userIdString);
        setSelectedUsername(item.username || "Unknown");
        setShowUserModal(true);
    };

    const closeModal = () => {
        setShowUserModal(false);
        setSelectedUserId(null);
        setSelectedUsername("");
    };

    return (
        <div className="user-leaderboard-container container">
            <div className="user-leaderboard-header">
                <h2 className="user-leaderboard-title">BẢNG XẾP HẠNG EASYTALK</h2>
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
                            {leaderboard.map((item, idx) => {
                                const hasUserId = !!(item.userId || item._id || item.user);
                                return (
                                    <tr
                                        key={item._id || idx}
                                        className={`user-leaderboard-row ${isCurrentUser(item.username) ? "current-user" : ""} ${idx < 3 ? "top-3" : ""}`}
                                    >
                                        <td className="user-leaderboard-rank"
                                            onClick={() => hasUserId && handleUserClick(item)}
                                            style={{
                                                cursor: hasUserId ? 'pointer' : 'default',
                                            }}
                                            title={hasUserId ? "Bấm để xem chi tiết thống kê" : "Không có thông tin"}
                                        >
                                            {idx < 3 ? (
                                                <div className={`rank-medal rank-${idx + 1}`}>
                                                    <i className="fas fa-medal"></i>
                                                </div>
                                            ) : (
                                                <span className="rank-number">{idx + 1}</span>
                                            )}
                                        </td>
                                        <td
                                            className="user-leaderboard-username"
                                            onClick={() => hasUserId && handleUserClick(item)}
                                            style={{
                                                cursor: hasUserId ? 'pointer' : 'default',
                                            }}
                                            title={hasUserId ? "Bấm để xem chi tiết thống kê" : "Không có thông tin"}
                                        >
                                            <span className="username-text">{item.username}</span>
                                            {isCurrentUser(item.username) && (
                                                <span className="current-user-badge">Bạn</span>
                                            )}
                                        </td>
                                        <td className="user-leaderboard-value"
                                            onClick={() => hasUserId && handleUserClick(item)}
                                            style={{
                                                cursor: hasUserId ? 'pointer' : 'default',
                                            }}
                                            title={hasUserId ? "Bấm để xem chi tiết thống kê" : "Không có thông tin"}
                                        >
                                            {getValueDisplay(item)}
                                        </td>
                                    </tr>
                                );
                            })}
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
            {showUserModal && selectedUserId && (
                <UserDetailModal
                    userId={selectedUserId}
                    username={selectedUsername}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

export default LeaderBoard;