import React, { useState, useEffect, useCallback } from "react";
import UserDetailModal from "@/components/user/UserDetailModal";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";

const LeaderBoard = () => {
    const { t, i18n } = useTranslation();
    const [activeTab, setActiveTab] = useState("exp");
    const [activePeriod, setActivePeriod] = useState("all");
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [selectedUsername, setSelectedUsername] = useState("");

    const periods = [
        { key: "all", label: t("leaderboardPage.periods.all") },
        { key: "week", label: t("leaderboardPage.periods.week") },
        { key: "month", label: t("leaderboardPage.periods.month") },
        { key: "year", label: t("leaderboardPage.periods.year") }
    ];

    const tabs = [
        { key: "exp", label: t("leaderboardPage.tabs.exp"), icon: "trophy" },
        { key: "time", label: t("leaderboardPage.tabs.time"), icon: "clock" },
        { key: "streak", label: t("leaderboardPage.tabs.streak"), icon: "fire" }
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
        const locale = i18n.language === "en" ? "en-US" : "vi-VN";
        const format = (date) => date.toLocaleDateString(locale);
        return t("leaderboardPage.periodRange", { start: format(start), end: format(end) });
    };

    const fetchLeaderboard = useCallback(async () => {
        document.title = t("leaderboardPage.documentTitle");
        setLoading(true);
        try {
            const data = await UserProgressService.getLeaderboard(activeTab, activePeriod, 50);
            setLeaderboard(data || []);
            try {
                const userProgress = await UserProgressService.getCurrentUserProgress();
                setCurrentUser(userProgress);
            } catch {
                setCurrentUser(null);
            }
        } catch (err) {
            console.error("Lỗi tải bảng xếp hạng:", err);
            setLeaderboard([]);
            Swal.fire({
                icon: "warning",
                title: t("leaderboardPage.alert.loadFailedTitle"),
                text: t("leaderboardPage.alert.loadFailedText"),
                timer: 3000,
                showConfirmButton: false
            });
        } finally {
            setLoading(false);
        }
    }, [activeTab, activePeriod, t]);

    useEffect(() => {
        fetchLeaderboard();
    }, [fetchLeaderboard]);

    const formatTime = (hours) => {
        if (!hours || hours < 0.01) return t("leaderboardPage.time.minutes", { count: 0 });
        if (hours < 1) return t("leaderboardPage.time.minutes", { count: Math.round(hours * 60) });
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        if (m > 0) return t("leaderboardPage.time.hoursMinutes", { hours: h, minutes: m });
        return t("leaderboardPage.time.hours", { count: h });
    };

    const isCurrentUser = (username) => {
        if (!currentUser) return false;
        if (currentUser.userDetails?.username == username) return true;
        const currentUsername = currentUser.userDetails?.username || AuthService.getCurrentUser()?.username;
        return currentUsername == username;
    };

    const getCurrentUsername = () => {
        if (currentUser?.userDetails?.username) return currentUser.userDetails.username;
        return AuthService.getCurrentUser()?.username || t("leaderboardPage.unknownUser");
    };

    const getValueDisplay = (item) => {
        if (activeTab == "exp") return t("leaderboardPage.values.exp", { value: Math.round(item.value).toLocaleString() });
        if (activeTab == "time") return formatTime(item.value);
        if (activeTab == "streak") return t("leaderboardPage.values.streak", { count: item.streak || 0 });
        return "-";
    };

    const periodRangeText = getPeriodRangeText();

    const handleUserClick = (item) => {
        const userId = item.userId || item._id || item.user;
        const userIdString = typeof userId === 'object' && userId.$oid ? userId.$oid : (userId.toString ? userId.toString() : String(userId));
        setSelectedUserId(userIdString);
        setSelectedUsername(item.username || t("leaderboardPage.unknownUser"));
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
                <h2 className="user-leaderboard-title">{t("leaderboardPage.title")}</h2>
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
                        <i className="fas fa-spinner fa-spin"></i> {t("leaderboardPage.loading")}
                    </div>
                ) : leaderboard.length == 0 ? (
                    <div className="user-leaderboard-empty">
                        <i className="fas fa-trophy fa-3x"></i>
                        <p>{t("leaderboardPage.empty.title")}</p>
                        <small>{t("leaderboardPage.empty.description")}</small>
                    </div>
                ) : (
                    <table className="user-leaderboard-table">
                        <thead>
                            <tr>
                                <th>{t("leaderboardPage.table.rank")}</th>
                                <th>{t("leaderboardPage.table.player")}</th>
                                <th>
                                    {activeTab == "exp" && t("leaderboardPage.table.exp")}
                                    {activeTab == "time" && t("leaderboardPage.table.time")}
                                    {activeTab == "streak" && t("leaderboardPage.table.streak")}
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
                                            title={hasUserId ? t("leaderboardPage.tooltip.viewStats") : t("leaderboardPage.tooltip.noInfo")}
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
                                            title={hasUserId ? t("leaderboardPage.tooltip.viewStats") : t("leaderboardPage.tooltip.noInfo")}
                                        >
                                            <span className="username-text">{item.username}</span>
                                            {isCurrentUser(item.username) && (
                                                <span className="current-user-badge">{t("leaderboardPage.currentUserBadge")}</span>
                                            )}
                                        </td>
                                        <td className="user-leaderboard-value"
                                            onClick={() => hasUserId && handleUserClick(item)}
                                            style={{
                                                cursor: hasUserId ? 'pointer' : 'default',
                                            }}
                                            title={hasUserId ? t("leaderboardPage.tooltip.viewStats") : t("leaderboardPage.tooltip.noInfo")}
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
                    <strong>{t("leaderboardPage.yourRank")}:</strong> {getCurrentUsername()} -
                    {" "} {activeTab == "exp" && t("leaderboardPage.values.exp", { value: currentUser.experiencePoints || 0 })}
                    {activeTab == "time" && ` ${formatTime(currentUser.studyTimes || 0)}`}
                    {activeTab == "streak" && ` ${t("leaderboardPage.values.streakConsecutive", { count: currentUser.streak || 0 })}`}
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
