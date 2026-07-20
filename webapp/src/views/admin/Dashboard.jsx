import React, { useEffect, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { DashboardService } from "@/services/DashboardService";

function Dashboard() {
    const [userActivity, setUserActivity] = useState({ labels: [], data: [] });
    const [overview, setOverview] = useState({
        totalJourneys: 0,
        totalLessons: 0,
        totalExercises: 0,
        totalUsers: 0,
        newUsersThisMonth: 0,
        activeUsersThisWeek: 0,
        activeUsersToday: 0
    });
    const [lessonBreakdown, setLessonBreakdown] = useState([]);
    const [exerciseBreakdown, setExerciseBreakdown] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [leaderboardTab, setLeaderboardTab] = useState('exp');
    const [topUsersExp, setTopUsersExp] = useState([]);
    const [topUsersTime, setTopUsersTime] = useState([]);
    const [topUsersStreak, setTopUsersStreak] = useState([]);
    const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
    const [lessonCompletionStats, setLessonCompletionStats] = useState(null);
    const [exerciseCompletionStats, setExerciseCompletionStats] = useState(null);
    const [popularLessons, setPopularLessons] = useState(null);
    const [popularExercises, setPopularExercises] = useState(null);
    const [hardestLessons, setHardestLessons] = useState(null);
    const [hardestExercises, setHardestExercises] = useState(null);
    const [securityOverview, setSecurityOverview] = useState({
        activeSessions: 0,
        revokedSessionsToday: 0,
        rotatedSessionsToday: 0,
        failedLoginsToday: 0,
        suspiciousRefreshReuse: 0,
        recentSecurityLogs: [],
        recentActiveSessions: []
    });

    useEffect(() => {
        loadDashboardData();
        return () => {
            DashboardService.resetAlertFlag();
        };
    }, []);

    useEffect(() => {
        loadLeaderboardData(leaderboardTab);
    }, [leaderboardTab]);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [
                activityData, 
                overviewData, 
                lessonData, 
                exerciseData, 
                activitiesData,
                lessonCompStats,
                exerciseCompStats,
                popLessons,
                popExercises,
                hardLessons,
                hardExercises,
                securityData
            ] = await Promise.all([
                DashboardService.fetchUserActivityLast7Days(),
                DashboardService.fetchDashboardOverview(),
                DashboardService.fetchLessonBreakdown(),
                DashboardService.fetchExerciseBreakdown(),
                DashboardService.fetchRecentActivities(5),
                DashboardService.fetchLessonCompletionStats(),
                DashboardService.fetchExerciseCompletionStats(),
                DashboardService.fetchMostPopularLessons(),
                DashboardService.fetchMostPopularExercises(),
                DashboardService.fetchLeastPopularLessons(),
                DashboardService.fetchLeastPopularExercises(),
                DashboardService.fetchSecurityOverview()
            ]);
            setUserActivity(activityData);
            setOverview(overviewData);
            setLessonBreakdown(lessonData);
            setExerciseBreakdown(exerciseData);
            setRecentActivities(activitiesData);
            setLessonCompletionStats(lessonCompStats);
            setExerciseCompletionStats(exerciseCompStats);
            setPopularLessons(popLessons);
            setPopularExercises(popExercises);
            setHardestLessons(hardLessons);
            setHardestExercises(hardExercises);
            setSecurityOverview(securityData);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadLeaderboardData = async (type) => {
        setIsLoadingLeaderboard(true);
        try {
            if (type === 'exp' && topUsersExp.length === 0) {
                const data = await DashboardService.fetchTopUsersByExp(10);
                setTopUsersExp(data);
            } else if (type === 'time' && topUsersTime.length === 0) {
                const data = await DashboardService.fetchTopUsersByStudyTime(10);
                setTopUsersTime(data);
            } else if (type === 'streak' && topUsersStreak.length === 0) {
                const data = await DashboardService.fetchTopUsersByStreak(10);
                setTopUsersStreak(data);
            }
        } catch (error) {
            console.error("Error loading leaderboard data:", error);
        } finally {
            setIsLoadingLeaderboard(false);
        }
    };

    const activityChartOptions = {
        chart: { 
            type: "line", 
            backgroundColor: "#ffffff", 
            borderRadius: 16, 
            height: 420 
        },
        title: { 
            text: "Hoạt Động Người Dùng (7 Ngày Gần Nhất)", 
            style: { 
                color: "#1e293b", 
                fontSize: "20px", 
                fontWeight: "700" 
            } 
        },
        xAxis: { 
            categories: userActivity.labels, 
            labels: { 
                style: { 
                    color: "#475569", 
                    fontSize: "13px" 
                }
            }, 
            lineColor: "#e2e8f0", 
            tickColor: "#e2e8f0" 
        },
        yAxis: { 
            title: { text: "Số người dùng" }, 
            gridLineColor: "#f1f5f9", 
            labels: { 
                style: { 
                    color: "#475569" 
                } 
            },
            allowDecimals: false,
            min: 0
        },
        legend: { enabled: false },
        tooltip: { 
            backgroundColor: "#1e293b", 
            style: { 
                color: "#fff",
                fontSize: "13px"
            }, 
            borderRadius: 10,
            useHTML: true,
            formatter: function () { 
                return `
                    <div style="padding: 8px;">
                        <div style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">
                            Ngày ${this.key}
                        </div>
                        <div style="font-size: 13px;">
                            Người dùng hoạt động: <b style="color: #34d399;">${this.y}</b>
                        </div>
                    </div>
                `; 
            } 
        },
        plotOptions: { 
            line: { 
                marker: { 
                    radius: 6, 
                    fillColor: "#34d399",
                    lineColor: "#059669",
                    lineWidth: 2
                }, 
                lineWidth: 3, 
                color: "#34d399",
                states: {
                    hover: {
                        lineWidth: 4
                    }
                }
            } 
        },
        series: [{ 
            name: "Người dùng", 
            data: userActivity.data 
        }],
        credits: { enabled: false }
    };

    const lessonPieOptions = {
        chart: { type: "pie", backgroundColor: "#ffffff", borderRadius: 16, height: 380 },
        title: { text: "Tỷ Lệ Số Bài Học", style: { color: "#1e293b", fontSize: "18px", fontWeight: "700" } },
        tooltip: { 
            pointFormat: "<b>{point.y}</b> bài học ({point.percentage:.1f}%)",
            style: { fontSize: "13px" }
        },
        plotOptions: {
            pie: {
                innerSize: "50%",
                allowPointSelect: true,
                cursor: "pointer",
                dataLabels: { 
                    enabled: true, 
                    format: "<b>{point.name}</b>: {point.y}", 
                    style: { color: "#1e293b", fontWeight: "600", fontSize: "13px" } 
                },
                showInLegend: true,
                borderRadius: 8
            }
        },
        series: [{ name: "Bài học", colorByPoint: true, data: lessonBreakdown }],
        credits: { enabled: false }
    };

    const exercisePieOptions = {
        chart: { type: "pie", backgroundColor: "#ffffff", borderRadius: 16, height: 380 },
        title: { text: "Tỷ Lệ Số Bài Luyện Tập", style: { color: "#1e293b", fontSize: "18px", fontWeight: "700" } },
        tooltip: { 
            pointFormat: "<b>{point.y}</b> bài luyện tập ({point.percentage:.1f}%)",
            style: { fontSize: "13px" }
        },
        plotOptions: {
            pie: {
                innerSize: "50%",
                allowPointSelect: true,
                cursor: "pointer",
                dataLabels: { 
                    enabled: true, 
                    format: "<b>{point.name}</b>: {point.y}", 
                    style: { color: "#1e293b", fontWeight: "600", fontSize: "13px" } 
                },
                showInLegend: true,
                borderRadius: 8
            }
        },
        series: [{ name: "Luyện tập", colorByPoint: true, data: exerciseBreakdown }],
        credits: { enabled: false }
    };

    const calculatePercentage = (current, label) => {
        if (label === 'month') return overview.newUsersThisMonth > 0 ? '+12%' : '0%';
        if (label === 'week') return overview.activeUsersThisWeek > 0 ? '+8%' : '0%';
        if (label === 'today') return overview.activeUsersToday > 0 ? '+5%' : '0%';
        return '+0%';
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getCurrentLeaderboardData = () => {
        if (leaderboardTab === 'exp') return topUsersExp;
        if (leaderboardTab === 'time') return topUsersTime;
        if (leaderboardTab === 'streak') return topUsersStreak;
        return [];
    };

    const formatDateTime = (value) => {
        if (!value) return "Chưa có";
        return new Date(value).toLocaleString("vi-VN");
    };

    const formatShortId = (value) => {
        if (!value) return "N/A";
        const id = typeof value === "object" && value.$oid ? value.$oid : String(value);
        return id.length > 10 ? `${id.slice(0, 6)}...${id.slice(-4)}` : id;
    };

    const formatSecurityEvent = (event) => {
        const labels = {
            login_success: "Đăng nhập thành công",
            login_failed: "Đăng nhập thất bại",
            social_login_success: "Đăng nhập MXH",
            refresh_token_reuse_detected: "Token reuse",
            password_changed: "Đổi mật khẩu",
            password_reset: "Reset mật khẩu",
            temp_password_reset: "Reset mật khẩu tạm",
            admin_role_changed: "Đổi quyền admin",
            user_locked: "Khóa tài khoản",
            user_unlocked: "Mở khóa tài khoản",
            logout_all_sessions: "Đăng xuất tất cả",
            session_revoked: "Thu hồi phiên"
        };
        return labels[event] || event || "Sự kiện";
    };

    const getDeviceName = (userAgent = "") => {
        if (!userAgent) return "Không rõ thiết bị";
        const browser = userAgent.includes("Edg") ? "Edge"
            : userAgent.includes("Chrome") ? "Chrome"
            : userAgent.includes("Firefox") ? "Firefox"
            : userAgent.includes("Safari") ? "Safari"
            : "Trình duyệt";
        const platform = userAgent.includes("Windows") ? "Windows"
            : userAgent.includes("Mac") ? "macOS"
            : userAgent.includes("Android") ? "Android"
            : userAgent.includes("iPhone") || userAgent.includes("iPad") ? "iOS"
            : "Thiết bị";
        return `${browser} - ${platform}`;
    };

    return (
        <div className="admin-dashboard">
            <h1 className="admin-dashboard-title">Dashboard Quản Trị</h1>
            <p className="admin-dashboard-subtitle">Chào mừng bạn trở lại! Dưới đây là tổng quan hệ thống.</p>
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <i className="fas fa-spinner fa-spin fa-3x text-primary"></i>
                    <p style={{ marginTop: '20px', color: '#64748b', fontSize: '16px', fontWeight: '500' }}>
                        Đang tải dữ liệu dashboard...
                    </p>
                </div>
            ) : (
                <>
                    <div className="dashboard-cards">
                        <div className="dashboard-card">
                            <div className="dashboard-card-info">
                                <h5>Hành Trình Học</h5>
                                <h2>{overview.totalJourneys}</h2>
                                <small className="text-success">{calculatePercentage(overview.totalJourneys, 'month')} tháng này</small>
                            </div>
                            <div className="dashboard-card-icon bg-primary">
                                <i className="fas fa-road"></i>
                            </div>
                        </div>
                        <div className="dashboard-card">
                            <div className="dashboard-card-info">
                                <h5>Tổng Bài Học</h5>
                                <h2>{overview.totalLessons}</h2>
                                <small className="text-success">{calculatePercentage(overview.totalLessons, 'week')} tuần này</small>
                            </div>
                            <div className="dashboard-card-icon bg-success">
                                <i className="fas fa-book"></i>
                            </div>
                        </div>
                        <div className="dashboard-card">
                            <div className="dashboard-card-info">
                                <h5>Tổng Bài Luyện Tập</h5>
                                <h2>{overview.totalExercises}</h2>
                                <small className="text-warning">{calculatePercentage(overview.totalExercises, 'today')} hôm nay</small>
                            </div>
                            <div className="dashboard-card-icon bg-warning">
                                <i className="fas fa-pencil-alt"></i>
                            </div>
                        </div>
                        <div className="dashboard-card">
                            <div className="dashboard-card-info">
                                <h5>Người Dùng</h5>
                                <h2>{overview.totalUsers}</h2>
                                <small className="text-info">+{overview.newUsersThisMonth} người mới</small>
                            </div>
                            <div className="dashboard-card-icon bg-danger">
                                <i className="fas fa-user-graduate"></i>
                            </div>
                        </div>
                    </div>
                    <div className="dashboard-security-section" style={{ marginTop: "24px", marginBottom: "24px" }}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "16px",
                            marginBottom: "16px"
                        }}>
                            <div>
                                <h5 style={{ margin: 0, color: "#1e293b", fontWeight: 700 }}>
                                    <i className="fas fa-shield-alt me-2"></i>
                                    Bảo Mật & Phiên Đăng Nhập
                                </h5>
                                <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
                                    Theo dõi refresh token, phiên đăng nhập và nhật ký bảo mật gần đây.
                                </p>
                            </div>
                            {securityOverview.suspiciousRefreshReuse > 0 && (
                                <span style={{
                                    background: "#fee2e2",
                                    color: "#b91c1c",
                                    borderRadius: "999px",
                                    padding: "8px 12px",
                                    fontSize: "13px",
                                    fontWeight: 700
                                }}>
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    Có cảnh báo token reuse
                                </span>
                            )}
                        </div>
                        <div className="dashboard-cards">
                            <div className="dashboard-card">
                                <div className="dashboard-card-info">
                                    <h5>Phiên Đang Hoạt Động</h5>
                                    <h2>{securityOverview.activeSessions}</h2>
                                    <small className="text-info">usersessions active</small>
                                </div>
                                <div className="dashboard-card-icon bg-success">
                                    <i className="fas fa-laptop"></i>
                                </div>
                            </div>
                            <div className="dashboard-card">
                                <div className="dashboard-card-info">
                                    <h5>Rotation Hôm Nay</h5>
                                    <h2>{securityOverview.rotatedSessionsToday}</h2>
                                    <small className="text-success">refresh token rotated</small>
                                </div>
                                <div className="dashboard-card-icon bg-primary">
                                    <i className="fas fa-sync-alt"></i>
                                </div>
                            </div>
                            <div className="dashboard-card">
                                <div className="dashboard-card-info">
                                    <h5>Login Thất Bại</h5>
                                    <h2>{securityOverview.failedLoginsToday}</h2>
                                    <small className="text-warning">trong hôm nay</small>
                                </div>
                                <div className="dashboard-card-icon bg-warning">
                                    <i className="fas fa-user-lock"></i>
                                </div>
                            </div>
                            <div className="dashboard-card">
                                <div className="dashboard-card-info">
                                    <h5>Token Reuse</h5>
                                    <h2>{securityOverview.suspiciousRefreshReuse}</h2>
                                    <small className={securityOverview.suspiciousRefreshReuse > 0 ? "text-danger" : "text-success"}>
                                        cảnh báo hôm nay
                                    </small>
                                </div>
                                <div className="dashboard-card-icon bg-danger">
                                    <i className="fas fa-radiation"></i>
                                </div>
                            </div>
                        </div>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                            gap: "20px",
                            marginTop: "20px"
                        }}>
                            <div className="dashboard-recent" style={{ marginTop: 0 }}>
                                <div className="recent-header">
                                    <h5><i className="fas fa-clipboard-list me-2"></i>Nhật Ký Bảo Mật Gần Đây</h5>
                                </div>
                                <div className="recent-list">
                                    {securityOverview.recentSecurityLogs.length > 0 ? (
                                        securityOverview.recentSecurityLogs.map((log) => (
                                            <div key={formatShortId(log._id)} className="recent-item">
                                                <i className={`fas ${log.status === "failed" ? "fa-times-circle text-danger" : "fa-check-circle text-success"} recent-icon`}></i>
                                                <div className="recent-content">
                                                    <div className="recent-text">
                                                        <strong>{formatSecurityEvent(log.event)}</strong>
                                                        <span style={{ color: "#64748b" }}> - {log.email || formatShortId(log.userId)}</span>
                                                    </div>
                                                    <small className="text-muted">
                                                        {log.ipAddress || "Không rõ IP"} • {formatDateTime(log.createdAt)}
                                                    </small>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                                            <i className="fas fa-clipboard-check fa-2x" style={{ marginBottom: '10px' }}></i>
                                            <p>Chưa có nhật ký bảo mật.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="dashboard-recent" style={{ marginTop: 0 }}>
                                <div className="recent-header">
                                    <h5><i className="fas fa-laptop-code me-2"></i>Phiên Đăng Nhập Gần Đây</h5>
                                </div>
                                <div className="recent-list">
                                    {securityOverview.recentActiveSessions.length > 0 ? (
                                        securityOverview.recentActiveSessions.map((session) => (
                                            <div key={session.sessionId || formatShortId(session._id)} className="recent-item">
                                                <i className="fas fa-desktop text-info recent-icon"></i>
                                                <div className="recent-content">
                                                    <div className="recent-text">
                                                        <strong>{getDeviceName(session.userAgent)}</strong>
                                                        <span style={{ color: "#64748b" }}> - {formatShortId(session.userId)}</span>
                                                    </div>
                                                    <small className="text-muted">
                                                        {session.ipAddress || "Không rõ IP"} • {formatDateTime(session.lastUsedAt || session.createdAt)}
                                                    </small>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                                            <i className="fas fa-laptop fa-2x" style={{ marginBottom: '10px' }}></i>
                                            <p>Chưa có phiên đăng nhập active.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="dashboard-pie-charts">
                        <div className="chart-pie-left">
                            <div className="chart-container">
                                <HighchartsReact highcharts={Highcharts} options={lessonPieOptions} />
                            </div>
                        </div>
                        <div className="chart-pie-right">
                            <div className="chart-container">
                                <HighchartsReact highcharts={Highcharts} options={exercisePieOptions} />
                            </div>
                        </div>
                    </div>
                    <div className="dashboard-completion-section">
                        {lessonCompletionStats && (
                            <div className="dashboard-completion-grid">
                                <div className="dashboard-completion-card">
                                    <div className="dashboard-completion-header">
                                        <i className="fas fa-book text-success"></i>
                                        <h5>Tỷ Lệ Hoàn Thành Bài Học</h5>
                                    </div>
                                    <div className="dashboard-completion-body">
                                        <div className="dashboard-completion-item">
                                            <span className="dashboard-completion-label">Ngữ Pháp:</span>
                                            <div className="dashboard-completion-progress">
                                                <div
                                                    className="dashboard-completion-bar"
                                                    style={{ width: `${lessonCompletionStats.grammars.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="dashboard-completion-percent">
                                                {lessonCompletionStats.grammars.percentage}%
                                            </span>
                                            <span className="dashboard-completion-detail">
                                                ({lessonCompletionStats.grammars.avgUnlocked}/{lessonCompletionStats.grammars.total} bài TB)
                                            </span>
                                        </div>
                                        <div className="dashboard-completion-item">
                                            <span className="dashboard-completion-label">Phát Âm:</span>
                                            <div className="dashboard-completion-progress">
                                                <div
                                                    className="dashboard-completion-bar bg-info"
                                                    style={{ width: `${lessonCompletionStats.pronunciations.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="dashboard-completion-percent">
                                                {lessonCompletionStats.pronunciations.percentage}%
                                            </span>
                                            <span className="dashboard-completion-detail">
                                                ({lessonCompletionStats.pronunciations.avgUnlocked}/{lessonCompletionStats.pronunciations.total} bài TB)
                                            </span>
                                        </div>
                                        <div className="dashboard-completion-item">
                                            <span className="dashboard-completion-label">Câu Chuyện:</span>
                                            <div className="dashboard-completion-progress">
                                                <div
                                                    className="dashboard-completion-bar bg-warning"
                                                    style={{ width: `${lessonCompletionStats.stories.percentage}%` }}
                                                ></div>
                                            </div>
                                            <span className="dashboard-completion-percent">
                                                {lessonCompletionStats.stories.percentage}%
                                            </span>
                                            <span className="dashboard-completion-detail">
                                                ({lessonCompletionStats.stories.avgUnlocked}/{lessonCompletionStats.stories.total} bài TB)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {exerciseCompletionStats && (
                                    <div className="dashboard-completion-card">
                                        <div className="dashboard-completion-header">
                                            <i className="fas fa-pencil-alt text-warning"></i>
                                            <h5>Tỷ Lệ Hoàn Thành Bài Tập</h5>
                                        </div>
                                        <div className="dashboard-completion-body">
                                            <div className="dashboard-completion-item">
                                                <span className="dashboard-completion-label">Ngữ Pháp:</span>
                                                <div className="dashboard-completion-progress">
                                                    <div
                                                        className="dashboard-completion-bar"
                                                        style={{ width: `${exerciseCompletionStats.grammarExercises.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="dashboard-completion-percent">
                                                    {exerciseCompletionStats.grammarExercises.percentage}%
                                                </span>
                                                <span className="dashboard-completion-detail">
                                                    ({exerciseCompletionStats.grammarExercises.avgUnlocked}/{exerciseCompletionStats.grammarExercises.total} bài TB)
                                                </span>
                                            </div>
                                            <div className="dashboard-completion-item">
                                                <span className="dashboard-completion-label">Phát Âm:</span>
                                                <div className="dashboard-completion-progress">
                                                    <div
                                                        className="dashboard-completion-bar bg-info"
                                                        style={{ width: `${exerciseCompletionStats.pronunciationExercises.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="dashboard-completion-percent">
                                                    {exerciseCompletionStats.pronunciationExercises.percentage}%
                                                </span>
                                                <span className="dashboard-completion-detail">
                                                    ({exerciseCompletionStats.pronunciationExercises.avgUnlocked}/{exerciseCompletionStats.pronunciationExercises.total} bài TB)
                                                </span>
                                            </div>
                                            <div className="dashboard-completion-item">
                                                <span className="dashboard-completion-label">Từ Vựng:</span>
                                                <div className="dashboard-completion-progress">
                                                    <div
                                                        className="dashboard-completion-bar bg-warning"
                                                        style={{ width: `${exerciseCompletionStats.vocabularyExercises.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="dashboard-completion-percent">
                                                    {exerciseCompletionStats.vocabularyExercises.percentage}%
                                                </span>
                                                <span className="dashboard-completion-detail">
                                                    ({exerciseCompletionStats.vocabularyExercises.avgUnlocked}/{exerciseCompletionStats.vocabularyExercises.total} bài TB)
                                                </span>
                                            </div>
                                            <div className="dashboard-completion-item">
                                                <span className="dashboard-completion-label">Nghe Chép:</span>
                                                <div className="dashboard-completion-progress">
                                                    <div
                                                        className="dashboard-completion-bar bg-danger"
                                                        style={{ width: `${exerciseCompletionStats.dictationExercises.percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="dashboard-completion-percent">
                                                    {exerciseCompletionStats.dictationExercises.percentage}%
                                                </span>
                                                <span className="dashboard-completion-detail">
                                                    ({exerciseCompletionStats.dictationExercises.avgUnlocked}/{exerciseCompletionStats.dictationExercises.total} bài TB)
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="dashboard-popular-grid">
                            {popularLessons && (
                                <div className="dashboard-popular-card">
                                    <div className="dashboard-popular-header popular">
                                        <i className="fas fa-fire"></i>
                                        <h5>Bài Học Phổ Biến Nhất</h5>
                                    </div>
                                    <div className="dashboard-popular-body">
                                        {popularLessons.grammar && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-success">
                                                    {popularLessons.grammar.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{popularLessons.grammar.title}</div>
                                                    <div className="dashboard-popular-count">
                                                        <i className="fas fa-users"></i> {popularLessons.grammar.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {popularLessons.pronunciation && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-primary">
                                                    {popularLessons.pronunciation.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{popularLessons.pronunciation.title}</div>
                                                    <div className="dashboard-popular-count">
                                                        <i className="fas fa-users"></i> {popularLessons.pronunciation.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {popularLessons.story && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-warning">
                                                    {popularLessons.story.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{popularLessons.story.title}</div>
                                                    <div className="dashboard-popular-count">
                                                        <i className="fas fa-users"></i> {popularLessons.story.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {popularExercises && (
                                <div className="dashboard-popular-card">
                                    <div className="dashboard-popular-header popular">
                                        <i className="fas fa-fire"></i>
                                        <h5>Bài Luyện Tập Phổ Biến Nhất</h5>
                                    </div>
                                    <div className="dashboard-popular-body">
                                        {popularExercises.grammarExercises && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-success">
                                                    {popularExercises.grammarExercises.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{popularExercises.grammarExercises.title}</div>
                                                    <div className="dashboard-popular-count">
                                                        <i className="fas fa-users"></i> {popularExercises.grammarExercises.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {popularExercises.pronunciationExercises && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-primary">
                                                    {popularExercises.pronunciationExercises.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{popularExercises.pronunciationExercises.title}</div>
                                                    <div className="dashboard-popular-count">
                                                        <i className="fas fa-users"></i> {popularExercises.pronunciationExercises.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {popularExercises.vocabularyExercises && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-warning">
                                                    {popularExercises.vocabularyExercises.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{popularExercises.vocabularyExercises.title}</div>
                                                    <div className="dashboard-popular-count">
                                                        <i className="fas fa-users"></i> {popularExercises.vocabularyExercises.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {popularExercises.dictations && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-danger">
                                                    {popularExercises.dictations.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{popularExercises.dictations.title}</div>
                                                    <div className="dashboard-popular-count">
                                                        <i className="fas fa-users"></i> {popularExercises.dictations.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {hardestLessons && (
                                <div className="dashboard-popular-card">
                                    <div className="dashboard-popular-header hardest">
                                        <i className="fas fa-exclamation-triangle"></i>
                                        <h5>Bài Học Khó Nhất</h5>
                                    </div>
                                    <div className="dashboard-popular-body">
                                        {hardestLessons.grammar && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-success">
                                                    {hardestLessons.grammar.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{hardestLessons.grammar.title}</div>
                                                    <div className="dashboard-popular-count text-danger">
                                                        <i className="fas fa-users"></i> Chỉ {hardestLessons.grammar.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {hardestLessons.pronunciation && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-primary">
                                                    {hardestLessons.pronunciation.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{hardestLessons.pronunciation.title}</div>
                                                    <div className="dashboard-popular-count text-danger">
                                                        <i className="fas fa-users"></i> Chỉ {hardestLessons.pronunciation.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {hardestLessons.story && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-warning">
                                                    {hardestLessons.story.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{hardestLessons.story.title}</div>
                                                    <div className="dashboard-popular-count text-danger">
                                                        <i className="fas fa-users"></i> Chỉ {hardestLessons.story.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            {hardestExercises && (
                                <div className="dashboard-popular-card">
                                    <div className="dashboard-popular-header hardest">
                                        <i className="fas fa-exclamation-triangle"></i>
                                        <h5>Bài Luyện Tập Khó Nhất</h5>
                                    </div>
                                    <div className="dashboard-popular-body">
                                        {hardestExercises.grammarExercises && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-success">
                                                    {hardestExercises.grammarExercises.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{hardestExercises.grammarExercises.title}</div>
                                                    <div className="dashboard-popular-count text-danger">
                                                        <i className="fas fa-users"></i> Chỉ {hardestExercises.grammarExercises.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {hardestExercises.pronunciationExercises && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-primary">
                                                    {hardestExercises.pronunciationExercises.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{hardestExercises.pronunciationExercises.title}</div>
                                                    <div className="dashboard-popular-count text-danger">
                                                        <i className="fas fa-users"></i> Chỉ {hardestExercises.pronunciationExercises.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {hardestExercises.vocabularyExercises && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-warning">
                                                    {hardestExercises.vocabularyExercises.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{hardestExercises.vocabularyExercises.title}</div>
                                                    <div className="dashboard-popular-count text-danger">
                                                        <i className="fas fa-users"></i> Chỉ {hardestExercises.vocabularyExercises.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {hardestExercises.dictations && (
                                            <div className="dashboard-popular-item">
                                                <span className="dashboard-popular-badge bg-danger">
                                                    {hardestExercises.dictations.type}
                                                </span>
                                                <div className="dashboard-popular-content">
                                                    <div className="dashboard-popular-title">{hardestExercises.dictations.title}</div>
                                                    <div className="dashboard-popular-count text-danger">
                                                        <i className="fas fa-users"></i> Chỉ {hardestExercises.dictations.count} người dùng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="dashboard-leaderboard">
                        <div className="dashboard-leaderboard-header">
                            <h5><i className="fas fa-trophy"></i> Bảng Xếp Hạng Top 10 Người Xuất Sắc Nhất EasyTalk</h5>
                        </div>
                        <div className="dashboard-leaderboard-tabs">
                            <button 
                                className={`dashboard-leaderboard-tab ${leaderboardTab === 'exp' ? 'active' : ''}`}
                                onClick={() => setLeaderboardTab('exp')}
                            >
                                <i className="fas fa-star"></i>
                                Điểm Kinh Nghiệm
                            </button>
                            <button 
                                className={`dashboard-leaderboard-tab ${leaderboardTab === 'time' ? 'active' : ''}`}
                                onClick={() => setLeaderboardTab('time')}
                            >
                                <i className="fas fa-clock"></i>
                                Thời Gian Học
                            </button>
                            <button 
                                className={`dashboard-leaderboard-tab ${leaderboardTab === 'streak' ? 'active' : ''}`}
                                onClick={() => setLeaderboardTab('streak')}
                            >
                                <i className="fas fa-fire"></i>
                                Streak
                            </button>
                        </div>
                        <div className="dashboard-leaderboard-content">
                            {isLoadingLeaderboard ? (
                                <div style={{ textAlign: 'center', padding: '50px 20px' }}>
                                    <i className="fas fa-spinner fa-spin fa-2x text-primary"></i>
                                    <p style={{ marginTop: '15px', color: '#64748b' }}>Đang tải bảng xếp hạng...</p>
                                </div>
                            ) : getCurrentLeaderboardData().length > 0 ? (
                                <div className="dashboard-leaderboard-list">
                                    {getCurrentLeaderboardData().map((user) => (
                                        <div key={user.userId} className="dashboard-leaderboard-item">
                                            <div className="dashboard-leaderboard-rank">
                                                {getRankIcon(user.rank)}
                                            </div>
                                            <div className="dashboard-leaderboard-user">
                                                <div className="dashboard-leaderboard-username">{user.username}</div>
                                            </div>
                                            <div className="dashboard-leaderboard-value">
                                                {leaderboardTab === 'exp' && (
                                                    <span className="dashboard-leaderboard-exp">
                                                        <i className="fas fa-star"></i> {user.value.toLocaleString()} EXP
                                                    </span>
                                                )}
                                                {leaderboardTab === 'time' && (
                                                    <span className="dashboard-leaderboard-time">
                                                        <i className="fas fa-clock"></i> {user.formattedValue}
                                                    </span>
                                                )}
                                                {leaderboardTab === 'streak' && (
                                                    <span className="dashboard-leaderboard-streak">
                                                        <i className="fas fa-fire"></i> {user.value} ngày
                                                        {user.maxStreak > user.value && (
                                                            <small style={{ marginLeft: '8px', color: '#94a3b8' }}>
                                                                (Max: {user.maxStreak})
                                                            </small>
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                                    <i className="fas fa-inbox fa-3x" style={{ marginBottom: '15px', opacity: 0.5 }}></i>
                                    <p>Chưa có dữ liệu bảng xếp hạng</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="dashboard-full-chart">
                        <div className="chart-container">
                            <HighchartsReact highcharts={Highcharts} options={activityChartOptions} />
                        </div>
                    </div>
                    <div className="dashboard-recent">
                        <div className="recent-header">
                            <h5><i className="fas fa-history me-2"></i>Hoạt Động Gần Đây Của Người Dùng</h5>
                        </div>
                        <div className="recent-list">
                            {recentActivities.length > 0 ? (
                                recentActivities.map(activity => (
                                    <div key={activity.id} className="recent-item">
                                        <i className={`${activity.icon} ${activity.color} recent-icon`}></i>
                                        <div className="recent-content">
                                            <div className="recent-text">
                                                <strong>{activity.user}</strong> {activity.action}
                                            </div>
                                            <small className="text-muted">{activity.time}</small>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                                    <i className="fas fa-inbox fa-2x" style={{ marginBottom: '10px' }}></i>
                                    <p>Chưa có hoạt động gần đây của người dùng</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Dashboard;