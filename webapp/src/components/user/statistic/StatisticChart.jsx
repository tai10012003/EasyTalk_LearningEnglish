import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

const StatisticChart = ({ activeChart, period, chartData, loading, fullDates, formatDateString, getCurrentDatePlotLine, onChartTypeChange, onPeriodChange, onExportExcel, onExportPpt, periods, username = null }) => {
    const isOwnStats = !username;
    const title = isOwnStats ? "Thống kê biểu đồ của bạn" : `Thống kê biểu đồ của ${username}`;
    const chartOptions = {
        chart: {
            type: activeChart == "time" ? "areaspline" : "column",
            backgroundColor: "#ffffff",
            borderRadius: 10,
            height: 420,
            spacing: [10, 10, 15, 10],
            style: { fontFamily: "Inter, sans-serif" },
        },
        title: {
            text: null,
            style: { color: "#1e293b", fontWeight: "600", fontSize: "18px" },
        },
        credits: { enabled: false },
        xAxis: {
            categories: fullDates.map((date) => {
                if (period == "week") {
                    const weekday = date.toLocaleDateString("vi-VN", { weekday: "long" });
                    const day = date.getDate().toString().padStart(2, "0");
                    const month = (date.getMonth() + 1).toString().padStart(2, "0");
                    const year = date.getFullYear();
                    return `${weekday} - ngày ${day}/${month}/${year}`;
                } else {
                    const day = date.getDate().toString().padStart(2, "0");
                    const month = (date.getMonth() + 1).toString().padStart(2, "0");
                    const year = date.getFullYear();
                    return `${day}/${month}/${year}`;
                }
            }),
            lineColor: "#e2e8f0",
            tickColor: "#e2e8f0",
            gridLineWidth: 0,
            labels: {
                style: { color: "#475569", fontSize: "13px", fontWeight: "500" },
            },
            title: { text: null },
            plotLines: getCurrentDatePlotLine() ? [getCurrentDatePlotLine()] : [],
        },
        yAxis: {
            title: { text: null },
            gridLineColor: "#f1f5f9",
            labels: {
                style: { color: "#475569", fontSize: "13px" },
                formatter: function () {
                    if (activeChart == "time") {
                        return this.value % 1 == 0 ? `${this.value}h` : `${Math.floor(this.value)}h${Math.round((this.value % 1) * 60)}p`;
                    } else {
                        return this.value >= 1000 ? `${(this.value / 1000).toFixed(1)}K` : this.value;
                    }
                },
            },
        },
        legend: {
            enabled: true,
            itemStyle: { color: "#334155", fontWeight: "500" },
            symbolRadius: 4,
        },
        tooltip: {
            useHTML: true,
            backgroundColor: "#1e293b",
            borderRadius: 10,
            borderColor: "transparent",
            style: { color: "#fff", fontSize: "13px" },
            formatter: function () {
                const value = this.y;
                const index = this.point.index;
                const rawDate = fullDates[index];
                const day = rawDate.getDate().toString().padStart(2, "0");
                const month = (rawDate.getMonth() + 1).toString().padStart(2, "0");
                const year = rawDate.getFullYear();
                const fullDate = period == "week" ? `${rawDate.toLocaleDateString("vi-VN", { weekday: "long" })} - ngày ${day}/${month}/${year}` : `ngày ${day}/${month}/${year}`;
                if (activeChart == "time") {
                    const h = Math.floor(value);
                    const m = Math.round((value - h) * 60);
                    const text = m > 0 ? `${h}h${m}p` : `${h}h`;
                    return `
                    <div style="padding:8px 12px;">
                        <b>Ngày:</b> ${fullDate}<br/>
                        <b>Thời gian học:</b> ${text}
                    </div>`;
                }
                return `
                <div style="padding:8px 12px;">
                    <b>Ngày:</b> ${fullDate}<br/>
                    <b>Kinh nghiệm:</b> ${value.toLocaleString()} KN
                </div>`;
            },
            shadow: true,
        },
        plotOptions: {
            areaspline: {
                fillColor: {
                    linearGradient: [0, 0, 0, 300],
                    stops: [
                        [0, "rgba(102,126,234,0.7)"],
                        [1, "rgba(118,75,162,0.05)"],
                    ],
                },
                lineColor: "#667eea",
                lineWidth: 3,
                marker: {
                    enabled: true,
                    radius: 5,
                    fillColor: "#667eea",
                    lineColor: "#fff",
                    lineWidth: 2,
                },
            },
            column: {
                borderRadius: 6,
                colorByPoint: true,
                colors: [
                    "#667eea",
                    "#764ba2",
                    "#60a5fa",
                    "#818cf8",
                    "#6366f1",
                    "#a78bfa",
                ],
            },
        },
        series: [
            {
                name: activeChart == "time" ? "Thời gian học" : "Điểm kinh nghiệm",
                data: fullDates.map((date) => {
                    const dateStr = formatDateString(date);
                    const found = chartData.find(item => item.date == dateStr);
                    return found ? found.value : 0;
                }),
            },
        ],
    };

    return (
        <div className="user-statistic-chart-container">
            <h3 className="user-statistic-info-title">{title}</h3>
            <div className="user-statistic-toolbar">
                <div className="user-statistic-left">
                    <div className="user-statistic-tabs">
                        <button
                            className={`user-statistic-tab ${activeChart == "time" ? "active" : ""}`}
                            onClick={() => onChartTypeChange("time")}
                        >
                            <i className="fas fa-clock"></i> Thời Gian Học
                        </button>
                        <button
                            className={`user-statistic-tab ${activeChart == "exp" ? "active" : ""}`}
                            onClick={() => onChartTypeChange("exp")}
                        >
                            <i className="fas fa-trophy"></i> Điểm Kinh Nghiệm
                        </button>
                    </div>
                    <div className="user-statistic-toolbar-item">
                        <div className="user-statistic-header-row">
                            <h3 className="user-statistic-chart-title">
                                {activeChart == "time"
                                    ? period == "week" ? "Thời gian học theo ngày"
                                    : period == "month" ? "Thời gian học theo tháng"
                                    : "Thời gian học theo năm"
                                    : period == "week" ? "Điểm kinh nghiệm theo ngày"
                                    : period == "month" ? "Điểm kinh nghiệm theo tháng"
                                    : "Điểm kinh nghiệm theo năm"}
                            </h3>
                            <div className="user-statistic-controls">
                                <select
                                    value={period}
                                    onChange={(e) => onPeriodChange(e.target.value)}
                                    className="user-statistic-select"
                                >
                                    {periods.map((p) => (
                                        <option key={p.key} value={p.key}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                                {isOwnStats && onExportExcel && onExportPpt && (
                                    <div className="user-statistic-export">
                                        <button className="user-statistic-btn excel" onClick={onExportExcel}>
                                            <i className="fas fa-file-excel"></i> Excel
                                        </button>
                                        <button className="user-statistic-btn ppt" onClick={onExportPpt}>
                                            <i className="fas fa-file-powerpoint"></i> PowerPoint
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="user-statistic-chart">
                {loading ? (
                    <div className="user-statistic-loading">
                        <i className="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
                    </div>
                ) : chartData.length == 0 ? (
                    <div className="user-statistic-empty">
                        <i className="fas fa-chart-line fa-3x"></i>
                        <p>Chưa có dữ liệu</p>
                        <small>Học mỗi ngày để thấy tiến bộ nhé!</small>
                    </div>
                ) : (
                    <HighchartsReact highcharts={Highcharts} options={chartOptions} />
                )}
            </div>
        </div>
    );
};

export default StatisticChart;