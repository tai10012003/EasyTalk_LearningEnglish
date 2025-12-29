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

    useEffect(() => {
        loadDashboardData();
        return () => {
            DashboardService.resetAlertFlag();
        };
    }, []);

    const loadDashboardData = async () => {
        setIsLoading(true);
        try {
            const [activityData, overviewData, lessonData, exerciseData, activitiesData] = await Promise.all([
                DashboardService.fetchUserActivityLast7Days(),
                DashboardService.fetchDashboardOverview(),
                DashboardService.fetchLessonBreakdown(),
                DashboardService.fetchExerciseBreakdown(),
                DashboardService.fetchRecentActivities(5)
            ]);
            setUserActivity(activityData);
            setOverview(overviewData);
            setLessonBreakdown(lessonData);
            setExerciseBreakdown(exerciseData);
            setRecentActivities(activitiesData);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setIsLoading(false);
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
        title: { text: "Tỷ Lệ Bài Học", style: { color: "#1e293b", fontSize: "18px", fontWeight: "700" } },
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
        title: { text: "Tỷ Lệ Bài Luyện Tập", style: { color: "#1e293b", fontSize: "18px", fontWeight: "700" } },
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
                                <h5>Bài Luyện Tập</h5>
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
                    <div className="dashboard-full-chart">
                        <div className="chart-container">
                            <HighchartsReact highcharts={Highcharts} options={activityChartOptions} />
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
                    
                    <div className="dashboard-recent">
                        <div className="recent-header">
                            <h5><i className="fas fa-history me-2"></i>Hoạt Động Gần Đây</h5>
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
                                    <p>Chưa có hoạt động gần đây</p>
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