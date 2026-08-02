import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useTranslation } from "react-i18next";

const StatisticChart = ({ activeChart, period, chartData, loading, fullDates, formatDateString, getCurrentDatePlotLine, onChartTypeChange, onPeriodChange, onExportExcel, onExportPpt, periods, username = null }) => {
    const { t, i18n } = useTranslation();
    const isOwnStats = !username;
    const locale = i18n.language === "en" ? "en-US" : "vi-VN";
    const title = isOwnStats ? t("statisticPage.chart.ownTitle") : t("statisticPage.chart.userTitle", { username });
    const formatChartDate = (date) => {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        if (period == "week") {
            const weekday = date.toLocaleDateString(locale, { weekday: "long" });
            return t("statisticPage.export.weekDateLabel", { weekday, day, month, year });
        }
        return `${day}/${month}/${year}`;
    };
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
            categories: fullDates.map(formatChartDate),
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
                const weekday = rawDate.toLocaleDateString(locale, { weekday: "long" });
                const fullDate = period == "week"
                    ? t("statisticPage.export.weekDateLabel", { weekday, day, month, year })
                    : t("statisticPage.chart.tooltip.dateValue", { day, month, year });
                if (activeChart == "time") {
                    const h = Math.floor(value);
                    const m = Math.round((value - h) * 60);
                    const text = m > 0 ? `${h}h${m}p` : `${h}h`;
                    return `
                    <div style="padding:8px 12px;">
                        <b>${t("statisticPage.chart.tooltip.date")}:</b> ${fullDate}<br/>
                        <b>${t("statisticPage.chart.tooltip.studyTime")}:</b> ${text}
                    </div>`;
                }
                return `
                <div style="padding:8px 12px;">
                    <b>${t("statisticPage.chart.tooltip.date")}:</b> ${fullDate}<br/>
                    <b>${t("statisticPage.chart.tooltip.experience")}:</b> ${t("statisticPage.values.exp", { value: value.toLocaleString() })}
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
                name: activeChart == "time" ? t("statisticPage.chart.series.time") : t("statisticPage.chart.series.exp"),
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
                            <i className="fas fa-clock"></i> {t("statisticPage.chart.tabs.time")}
                        </button>
                        <button
                            className={`user-statistic-tab ${activeChart == "exp" ? "active" : ""}`}
                            onClick={() => onChartTypeChange("exp")}
                        >
                            <i className="fas fa-trophy"></i> {t("statisticPage.chart.tabs.exp")}
                        </button>
                    </div>
                    <div className="user-statistic-toolbar-item">
                        <div className="user-statistic-header-row">
                            <h3 className="user-statistic-chart-title">
                                {t(`statisticPage.chart.titles.${activeChart}.${period}`)}
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
                        <i className="fas fa-spinner fa-spin"></i> {t("statisticPage.loading")}
                    </div>
                ) : chartData.length == 0 ? (
                    <div className="user-statistic-empty">
                        <i className="fas fa-chart-line fa-3x"></i>
                        <p>{t("statisticPage.chart.empty.title")}</p>
                        <small>{t("statisticPage.chart.empty.description")}</small>
                    </div>
                ) : (
                    <HighchartsReact highcharts={Highcharts} options={chartOptions} />
                )}
            </div>
        </div>
    );
};

export default StatisticChart;
