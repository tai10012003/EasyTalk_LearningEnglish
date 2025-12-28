import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const dashboardData = {
    totalJourneys: 12,
    totalLessons: 45,
    totalExercises: 68,
    totalUsers: 156,
    lessonBreakdown: [
        { name: "Ngữ Pháp", y: 25 },
        { name: "Phát Âm", y: 15 },
        { name: "Câu Chuyện", y: 5 }
    ],
    exerciseBreakdown: [
        { name: "Ngữ Pháp", y: 28 },
        { name: "Phát Âm", y: 18 },
        { name: "Từ Vựng", y: 12 },
        { name: "Nghe Chép", y: 10 }
    ],
    userActivity: [12, 19, 15, 25, 22, 30, 28],
    recentActivities: [
        { id: 1, user: "Nguyễn Văn A", action: "Hoàn thành bài Ngữ Pháp Level 3", time: "5 phút trước", icon: "fas fa-check-circle", color: "text-success" },
        { id: 2, user: "Trần Thị B", action: "Thêm bài luyện tập Phát Âm mới", time: "15 phút trước", icon: "fas fa-plus-circle", color: "text-primary" },
        { id: 3, user: "Lê Văn C", action: "Đăng ký tài khoản mới", time: "1 giờ trước", icon: "fas fa-user-plus", color: "text-info" },
        { id: 4, user: "Admin", action: "Cập nhật Hành Trình Mới", time: "2 giờ trước", icon: "fas fa-road", color: "text-warning" },
        { id: 5, user: "Phạm Thị D", action: "Hoàn thành Câu Chuyện tuần này", time: "3 giờ trước", icon: "fas fa-book-reader", color: "text-purple" }
    ]
};

function Dashboard() {
    const activityChartOptions = {
        chart: { type: "line", backgroundColor: "#ffffff", borderRadius: 16, height: 420 },
        title: { text: "Hoạt Động Người Dùng (7 Ngày Gần Nhất)", style: { color: "#1e293b", fontSize: "20px", fontWeight: "700" } },
        xAxis: { categories: ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"], labels: { style: { color: "#475569", fontSize: "13px" } }, lineColor: "#e2e8f0", tickColor: "#e2e8f0" },
        yAxis: { title: { text: null }, gridLineColor: "#f1f5f9", labels: { style: { color: "#475569" } } },
        legend: { enabled: false },
        tooltip: { backgroundColor: "#1e293b", style: { color: "#fff" }, borderRadius: 10, formatter: function () { return `<b>${this.x}</b><br/>Người dùng hoạt động: <b>${this.y}</b>`; } },
        plotOptions: { line: { marker: { radius: 6, fillColor: "#34d399" }, lineWidth: 4, color: "#34d399" } },
        series: [{ name: "Người dùng", data: dashboardData.userActivity }],
        credits: { enabled: false }
    };

    const lessonPieOptions = {
        chart: { type: "pie", backgroundColor: "#ffffff", borderRadius: 16, height: 380 },
        title: { text: "Tỷ Lệ Bài Học", style: { color: "#1e293b", fontSize: "18px", fontWeight: "700" } },
        tooltip: { pointFormat: "<b>{point.percentage:.1f}%</b>" },
        plotOptions: {
            pie: {
                innerSize: "50%",
                allowPointSelect: true,
                cursor: "pointer",
                dataLabels: { enabled: true, format: "<b>{point.name}</b>: {point.y}", style: { color: "#1e293b", fontWeight: "600" } },
                showInLegend: true,
                borderRadius: 8
            }
        },
        series: [{ name: "Bài học", colorByPoint: true, data: dashboardData.lessonBreakdown }],
        credits: { enabled: false }
    };

    const exercisePieOptions = {
        chart: { type: "pie", backgroundColor: "#ffffff", borderRadius: 16, height: 380 },
        title: { text: "Tỷ Lệ Bài Luyện Tập", style: { color: "#1e293b", fontSize: "18px", fontWeight: "700" } },
        tooltip: { pointFormat: "<b>{point.percentage:.1f}%</b>" },
        plotOptions: {
            pie: {
                innerSize: "50%",
                allowPointSelect: true,
                cursor: "pointer",
                dataLabels: { enabled: true, format: "<b>{point.name}</b>: {point.y}", style: { color: "#1e293b", fontWeight: "600" } },
                showInLegend: true,
                borderRadius: 8
            }
        },
        series: [{ name: "Luyện tập", colorByPoint: true, data: dashboardData.exerciseBreakdown }],
        credits: { enabled: false }
    };

    return (
        <div className="admin-dashboard">
            <h1 className="admin-dashboard-title">Dashboard Quản Trị</h1>
            <p className="admin-dashboard-subtitle">Chào mừng bạn trở lại! Dưới đây là tổng quan hệ thống.</p>
            <div className="dashboard-cards">
                <div className="dashboard-card">
                    <div className="dashboard-card-info">
                        <h5>Hành Trình Học</h5>
                        <h2>{dashboardData.totalJourneys}</h2>
                        <small className="text-success">+12% tháng này</small>
                    </div>
                    <div className="dashboard-card-icon bg-primary">
                        <i className="fas fa-road"></i>
                    </div>
                </div>
                <div className="dashboard-card">
                    <div className="dashboard-card-info">
                        <h5>Tổng Bài Học</h5>
                        <h2>{dashboardData.totalLessons}</h2>
                        <small className="text-success">+8% tuần này</small>
                    </div>
                    <div className="dashboard-card-icon bg-success">
                        <i className="fas fa-book"></i>
                    </div>
                </div>
                <div className="dashboard-card">
                    <div className="dashboard-card-info">
                        <h5>Bài Luyện Tập</h5>
                        <h2>{dashboardData.totalExercises}</h2>
                        <small className="text-warning">+5% hôm nay</small>
                    </div>
                    <div className="dashboard-card-icon bg-warning">
                        <i className="fas fa-pencil-alt"></i>
                    </div>
                </div>
                <div className="dashboard-card">
                    <div className="dashboard-card-info">
                        <h5>Người Dùng</h5>
                        <h2>{dashboardData.totalUsers}</h2>
                        <small className="text-info">+18 người mới</small>
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
                    {dashboardData.recentActivities.map(activity => (
                        <div key={activity.id} className="recent-item">
                            <i className={`${activity.icon} ${activity.color} recent-icon`}></i>
                            <div className="recent-content">
                                <div className="recent-text">
                                    <strong>{activity.user}</strong> {activity.action}
                                </div>
                                <small className="text-muted">{activity.time}</small>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;