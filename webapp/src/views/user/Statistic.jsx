import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import { PrizeService } from "@/services/PrizeService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import * as XLSX from "xlsx";
import PptxGenJS from "pptxgenjs";
import Swal from "sweetalert2";

const Statistic = () => {
    const navigate = useNavigate();
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
    const [unlockedGrammar, setUnlockedGrammar] = useState(0);
    const [unlockedPronunciation, setUnlockedPronunciation] = useState(0);
    const [unlockedVocab, setUnlockedVocab] = useState(0);
    const [unlockedGrammarPractice, setUnlockedGrammarPractice] = useState(0);
    const [unlockedPronunciationPractice, setUnlockedPronunciationPractice] = useState(0);
    const [unlockedDictation, setUnlockedDictation] = useState(0);
    const [allPrizes, setAllPrizes] = useState([]);
    const [userPrizes, setUserPrizes] = useState([]);
    const [prizesLoading, setPrizesLoading] = useState(true);

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

    const fetchStats = async () => {
        document.title = "Thống Kê Tiến Trình Học Tập - EasyTalk";
        setLoading(true);
        try {
            const stats = await UserProgressService.getUserStatistics(activeChart, period);
            const progress = await UserProgressService.getCurrentUserProgress();
            if (!progress) {
                setLoading(false);
                return;
            }
            setChartData(stats.data || []);
            setStreak(progress?.streak || 0);
            setMaxStreak(progress?.maxStreak || 0);
            setCurrentUser(progress);
            const dailyExp = progress?.dailyExperiencePoints || {};
            const maxExp = Math.max(...Object.values(dailyExp).map(v => v || 0), 0);
            setMaxDailyExp(Math.round(maxExp));
            setUnlockedGates(progress?.gateDetails?.length || 0);
            setUnlockedStages(progress?.stageDetails?.length || 0);
            setUnlockedGrammar(progress?.grammarDetails?.length || 0);
            setUnlockedPronunciation(progress?.pronunciationDetails?.length || 0);
            setUnlockedVocab(progress?.vocabularyExerciseDetails?.length || 0);
            setUnlockedGrammarPractice(progress?.grammarExerciseDetails?.length || 0);
            setUnlockedPronunciationPractice(progress?.pronunciationExerciseDetails?.length || 0);
            setUnlockedDictation(progress?.dictationExerciseDetails?.length || 0);
        } catch (err) {
            console.error("Lỗi tải thống kê:", err);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể tải dữ liệu thống kê. Vui lòng thử lại.",
                timer: 3000,
            });
            setChartData([]);
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchPrizes = async () => {
        setPrizesLoading(true);
        try {
            const [prizes, userUnlockedPrizes] = await Promise.all([
                PrizeService.getAllPrizes(),
                UserProgressService.getUserPrizes()
            ]);
            setAllPrizes(prizes);
            setUserPrizes(userUnlockedPrizes);
        } catch (err) {
            console.error("Lỗi tải giải thưởng:", err);
        } finally {
            setPrizesLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchPrizes();
    }, [activeChart, period]);

    const getUsername = () => {
        if (currentUser?.userDetails?.username) return currentUser.userDetails.username;
        return AuthService.getCurrentUser()?.username || "Unknown";
    };

    const getEmail = () => {
        if (currentUser?.userDetails?.email) return currentUser.userDetails.email;
        return AuthService.getCurrentUser()?.email || "Unknown";
    };

    const isPrizeUnlocked = (prizeCode) => {
        return userPrizes.some(up => up.code == prizeCode);
    };

    const getPrizesByType = (type) => {
        return allPrizes.filter(p => p.type === type).sort((a, b) => a.level - b.level);
    };

    const getFullDates = () => {
        const dates = [];
        const today = getVNDate();
        if (period == "week") {
            const dayOfWeek = today.getDay();
            const diffToMonday = dayOfWeek == 0 ? -6 : 1 - dayOfWeek;
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() + diffToMonday);
            const current = new Date(startOfWeek);
            while (current <= today) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        } else if (period == "month") {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const current = new Date(startOfMonth);
            while (current <= today) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        } else if (period == "year") {
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
        const index = fullDates.findIndex(date => {
            return date.getTime() == today.getTime();
        });
        if (index == -1) return null;
        return {
            color: '#ff4d4f',
            width: 2,
            value: index,
            dashStyle: 'Dash',
            zIndex: 10
        };
    };

    const fullDates = getFullDates();

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

    const exportExcel = () => {
        if (!currentUser) return;
        const personalInfo = [
            ["THÔNG TIN CÁ NHÂN"],
            ["Username", getUsername()],
            ["Email", getEmail()],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(personalInfo);
        const chartTitle = activeChart == "time" ? (period == "week" ? "Thời gian học theo ngày (tuần này)" : period == "month" ? "Thời gian học theo tháng" : "Thời gian học theo năm"): (period == "week" ? "Điểm kinh nghiệm theo ngày (tuần này)" : period == "month" ? "Điểm kinh nghiệm theo tháng" : "Điểm kinh nghiệm theo năm");
        const headers = ["Ngày", activeChart == "time" ? "Thời gian học (giờ)" : "Điểm kinh nghiệm"];
        const excelData = [ [chartTitle], [], headers ];
        fullDates.forEach(date => {
            const dateStr = formatDateString(date);
            const found = chartData.find(item => item.date == dateStr);
            const value = found ? found.value : 0;
            let dateLabel;
            if (period == "week") {
                const weekday = date.toLocaleDateString("vi-VN", { weekday: "long" });
                const day = date.getDate().toString().padStart(2, "0");
                const month = (date.getMonth() + 1).toString().padStart(2, "0");
                const year = date.getFullYear();
                dateLabel = `${weekday} - ngày ${day}/${month}/${year}`;
            } else {
                const day = date.getDate().toString().padStart(2, "0");
                const month = (date.getMonth() + 1).toString().padStart(2, "0");
                const year = date.getFullYear();
                dateLabel = `${day}/${month}/${year}`;
            }
            excelData.push([dateLabel, value]);
        });
        const ws2 = XLSX.utils.aoa_to_sheet(excelData);
        const styleSheet = (ws, isPersonal = false) => {
            const range = XLSX.utils.decode_range(ws["!ref"]);
            const borderStyle = {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            };
            for (let R = range.s.r; R <= range.e.r; ++R) {
                for (let C = range.s.c; C <= range.e.c; ++C) {
                    const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                    if (!ws[cellAddress]) ws[cellAddress] = { v: "" };
                    ws[cellAddress].s = ws[cellAddress].s || {};
                    ws[cellAddress].s.border = borderStyle;
                    if (isPersonal) {
                        if (R == 0) {
                            ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center" };
                            ws[cellAddress].s.font = { bold: true, sz: 16, color: { rgb: "003366" } };
                            ws[cellAddress].s.fill = { fgColor: { rgb: "E6F0FA" } };
                        } else {
                            ws[cellAddress].s.alignment = { horizontal: "left", vertical: "center" };
                            ws[cellAddress].s.font = { sz: 12 };
                        }
                    } else {
                        if (R == 0 || R == 2) {
                            ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center" };
                            ws[cellAddress].s.font = { bold: true, sz: 14, color: { rgb: "003366" } };
                            ws[cellAddress].s.fill = { fgColor: { rgb: "E6F0FA" } };
                        } else if (R >= 3) {
                            ws[cellAddress].s.alignment = { horizontal: "center", vertical: "center" };
                            ws[cellAddress].s.font = { sz: 12 };
                            if (C == 1 && activeChart == "time" && ws[cellAddress].v !== "") {
                                ws[cellAddress].z = "0.00";
                            }
                        }
                    }
                }
            }
            const colWidths = [];
            for (let C = range.s.c; C <= range.e.c; ++C) {
                let maxLen = 10;
                for (let R = range.s.r; R <= range.e.r; ++R) {
                    const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
                    if (cell && cell.v) {
                        const len = cell.v.toString().length;
                        maxLen = Math.max(maxLen, len);
                    }
                }
                colWidths.push({ wch: Math.min(maxLen + 6, 50) });
            }
            ws["!cols"] = colWidths;
            ws["!rows"] = ws["!rows"] || [];
            ws["!rows"][0] = { hpt: 30 };
            if (!isPersonal) ws["!rows"][2] = { hpt: 25 };
        };
        styleSheet(ws1, true);
        styleSheet(ws2);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws1, "Thông tin cá nhân");
        XLSX.utils.book_append_sheet(wb, ws2, "Thống kê biểu đồ");
        const vnNow = getVNDate(new Date());
        const hours = new Date().getHours().toString().padStart(2, "0");
        const minutes = new Date().getMinutes().toString().padStart(2, "0");
        const seconds = new Date().getSeconds().toString().padStart(2, "0");
        const day = vnNow.getDate().toString().padStart(2, "0");
        const month = (vnNow.getMonth() + 1).toString().padStart(2, "0");
        const year = vnNow.getFullYear();
        const timestamp = `${hours}h${minutes}p${seconds}s_${day}-${month}-${year}`;
        const username = getUsername();
        XLSX.writeFile(wb, `ThongKe_${username}_${timestamp}.xlsx`);
    };

    const exportPpt = () => {
        const pptx = new PptxGenJS();
        const slide1 = pptx.addSlide();
        slide1.addText("Thông tin cá nhân:", {
            x: 0.5,
            y: 1.5,
            fontSize: 24,
            bold: true,
            color: "1e293b"
        });
        slide1.addText(`Username: ${getUsername()}`, {
            x: 0.5,
            y: 2.3,
            fontSize: 18,
            color: "475569"
        });
        slide1.addText(`Email: ${getEmail()}`, {
            x: 0.5,
            y: 2.8,
            fontSize: 18,
            color: "475569"
        });
        const slide2 = pptx.addSlide();
        const chartTitle = activeChart == "time" ? (period == "week" ? "Thời gian học theo ngày" : period == "month" ? "Thời gian học theo tháng" : "Thời gian học theo năm") : (period == "week" ? "Điểm kinh nghiệm theo ngày" : period == "month" ? "Điểm kinh nghiệm theo tháng" : "Điểm kinh nghiệm theo năm");
        slide2.addText(chartTitle, {
            x: 0.5,
            y: 0.5,
            fontSize: 20,
            bold: true,
            color: "1e293b"
        });
        const chartLabels = fullDates.map((date) => {
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
        });
        const chartValues = fullDates.map((date) => {
            const dateStr = formatDateString(date);
            const found = chartData.find(item => item.date == dateStr);
            return found ? Number(found.value.toFixed(4)) : 0;
        });
        if (activeChart == "time") {
            slide2.addChart(
                pptx.ChartType.line,
                [
                    {
                        name: "Thời gian học",
                        labels: chartLabels,
                        values: chartValues,
                    }
                ],
                {
                    x: 0.5,
                    y: 1.0,
                    w: 9,
                    h: 4.5,
                    showTitle: false,
                    showLegend: true,
                    legendPos: "b",
                    showValue: true,
                    dataLabelFontSize: 12,
                    dataLabelColor: "1e293b",
                    dataLabelFormatCode: "0.00",
                    dataLabelPosition: "bestFit",
                    chartColors: ["667EEA"],
                    lineDataSymbol: "circle",
                    lineSize: 3,
                    valAxisMinVal: 0,
                    valAxisMaxVal: Math.max(...chartValues) > 0 ? Math.max(...chartValues) * 1.1 : 1,
                    valAxisTitle: "Giờ",
                    valAxisLabelFormatCode: "0.00",
                }
            );
        } else {
            slide2.addChart(
                pptx.ChartType.bar,
                [
                    {
                        name: "Điểm kinh nghiệm",
                        labels: chartLabels,
                        values: chartValues,
                    }
                ],
                {
                    x: 0.5,
                    y: 1.0,
                    w: 9,
                    h: 4.5,
                    showTitle: false,
                    showLegend: true,
                    legendPos: "b",
                    showValue: true,
                    dataLabelFontSize: 12,
                    dataLabelColor: "1e293b",
                    chartColors: ["667EEA"],
                    barDir: "col",
                    valAxisMinVal: 0,
                    valAxisMaxVal: Math.max(...chartValues) > 0 ? Math.max(...chartValues) * 1.1 : 100,
                }
            );
        }
        const vnNow = getVNDate(new Date());
        const hours = new Date().getHours().toString().padStart(2, "0");
        const minutes = new Date().getMinutes().toString().padStart(2, "0");
        const seconds = new Date().getSeconds().toString().padStart(2, "0");
        const day = vnNow.getDate().toString().padStart(2, "0");
        const month = (vnNow.getMonth() + 1).toString().padStart(2, "0");
        const year = vnNow.getFullYear();
        const timestamp = `${hours}h${minutes}p${seconds}s_${day}-${month}-${year}`;
        const username = getUsername();
        pptx.writeFile({ fileName: `ThongKe_${username}_${timestamp}.pptx` });
    };

    return (
        <div className="user-statistic-container container">
            <div className="user-statistic-header">
                <h2 className="user-statistic-title">THỐNG KÊ TIẾN TRÌNH HỌC TẬP</h2>
                <p className="user-statistic-subtitle">
                    Theo dõi thói quen học tập của bạn mỗi ngày
                </p>
            </div>
            {loading ? (
                <div className="user-statistic-loading">
                    <i className="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
                </div>
            ) : (
                currentUser && (
                    <div className="user-statistic-info-container">
                        <h3 className="user-statistic-info-title">Thông tin cá nhân của bạn</h3>
                        <div className="user-statistic-info">
                            <p><strong>Username:</strong> {getUsername()}</p>
                            <p><strong>Email:</strong> {getEmail()}</p>
                        </div>
                    </div>
                )
            )}
            <div className="user-statistic-chart-container">
                <h3 className="user-statistic-info-title">Thống kê biểu đồ của bạn</h3>
                <div className="user-statistic-toolbar">
                    <div className="user-statistic-left">
                        <div className="user-statistic-tabs">
                            <button
                                className={`user-statistic-tab ${activeChart == "time" ? "active" : ""}`}
                                onClick={() => setActiveChart("time")}
                            >
                                <i className="fas fa-clock"></i> Thời Gian Học
                            </button>
                            <button
                                className={`user-statistic-tab ${activeChart == "exp" ? "active" : ""}`}
                                onClick={() => setActiveChart("exp")}
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
                                        onChange={(e) => setPeriod(e.target.value)}
                                        className="user-statistic-select"
                                    >
                                        {periods.map((p) => (
                                            <option key={p.key} value={p.key}>
                                                {p.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="user-statistic-export">
                                        <button className="user-statistic-btn excel" onClick={exportExcel}>
                                            <i className="fas fa-file-excel"></i> Excel
                                        </button>
                                        <button className="user-statistic-btn ppt" onClick={exportPpt}>
                                            <i className="fas fa-file-powerpoint"></i> PowerPoint
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* <div className="user-statistic-date-range">
                {fullDates.length > 0 && (
                    <span>
                        Từ {fullDates[0].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        {" - "}
                        {fullDates[fullDates.length - 1].toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                )}
            </div> */}
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
            <div className="user-statistic-achievements">
                <h3 className="user-statistic-info-title">Thành tích của bạn</h3>
                <div className="user-statistic-achievement-grid">
                    <div className="user-statistic-card" onClick={() => navigate('/streak')} style={{ cursor: 'pointer' }}>
                        <div className="user-statistic-icon fire">
                            <i className="fas fa-fire"></i>
                        </div>
                        <div className="user-statistic-info">
                            <div className="user-statistic-label">Streak hiện tại</div>
                            <div className="user-statistic-value">{streak} ngày</div>
                        </div>
                    </div>
                    <div className="user-statistic-card record" onClick={() => navigate('/streak')} style={{ cursor: 'pointer' }}>
                        <div className="user-statistic-icon trophy">
                            <i className="fas fa-trophy"></i>
                        </div>
                        <div className="user-statistic-info">
                            <div className="user-statistic-label">Kỷ lục streak</div>
                            <div className="user-statistic-value">{maxStreak} ngày</div>
                        </div>
                    </div>
                    <div className="user-statistic-card">
                        <div className="user-statistic-icon exp">
                            <i className="fas fa-star"></i>
                        </div>
                        <div className="user-statistic-info">
                            <div className="user-statistic-label">Điểm KN hiện tại</div>
                            <div className="user-statistic-value">{(currentUser?.experiencePoints || 0).toLocaleString()} KN</div>
                        </div>
                    </div>
                    <div className="user-statistic-card record-exp">
                        <div className="user-statistic-icon record-exp-icon">
                            <i className="fas fa-bolt"></i>
                        </div>
                        <div className="user-statistic-info">
                            <div className="user-statistic-label">Kỷ lục KN/ngày</div>
                            <div className="user-statistic-value">{maxDailyExp} KN</div>
                        </div>
                    </div>
                </div>
                <div className="user-statistic-unlocked-container">
                    <div className="user-statistic-unlocked-grid">
                        <div className="user-statistic-unlocked-item">
                            <i className="fas fa-door-open"></i>
                            <div>
                                <div className="user-statistic-unlocked-label">Số cổng</div>
                                <div className="user-statistic-unlocked-value">{unlockedGates} cổng</div>
                            </div>
                        </div>
                        <div className="user-statistic-unlocked-item">
                            <i className="fas fa-route"></i>
                            <div>
                                <div className="user-statistic-unlocked-label">Số chặng</div>
                                <div className="user-statistic-unlocked-value">{unlockedStages} chặng</div>
                            </div>
                        </div>
                        <div className="user-statistic-unlocked-item">
                            <i className="fas fa-book"></i>
                            <div>
                                <div className="user-statistic-unlocked-label">Bài học ngữ pháp</div>
                                <div className="user-statistic-unlocked-value">{unlockedGrammar} bài</div>
                            </div>
                        </div>
                        <div className="user-statistic-unlocked-item">
                            <i className="fas fa-microphone"></i>
                            <div>
                                <div className="user-statistic-unlocked-label">Bài học phát âm</div>
                                <div className="user-statistic-unlocked-value">{unlockedPronunciation} bài</div>
                            </div>
                        </div>
                        <div className="user-statistic-unlocked-item">
                            <i className="fas fa-dumbbell"></i>
                            <div>
                                <div className="user-statistic-unlocked-label">Luyện từ vựng</div>
                                <div className="user-statistic-unlocked-value">{unlockedVocab} bài</div>
                            </div>
                        </div>
                        <div className="user-statistic-unlocked-item">
                            <i className="fas fa-pencil-alt"></i>
                            <div>
                                <div className="user-statistic-unlocked-label">Luyện ngữ pháp</div>
                                <div className="user-statistic-unlocked-value">{unlockedGrammarPractice} bài</div>
                            </div>
                        </div>
                        <div className="user-statistic-unlocked-item">
                            <i className="fas fa-microphone"></i>
                            <div>
                                <div className="user-statistic-unlocked-label">Luyện phát âm</div>
                                <div className="user-statistic-unlocked-value">{unlockedPronunciationPractice} bài</div>
                            </div>
                        </div>
                        <div className="user-statistic-unlocked-item">
                            <i className="fas fa-headphones"></i>
                            <div>
                                <div className="user-statistic-unlocked-label">Luyện Nghe chép chính tả</div>
                                <div className="user-statistic-unlocked-value">{unlockedDictation} bài</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
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
                                                <i className="fas fa-crown"></i>
                                                <div>
                                                    <strong>Quán Quân Tuần:</strong>
                                                    <p>Đạt rank 1 vào cuối tuần (Chủ nhật) trên bảng xếp hạng KN hoặc Thời gian học</p>
                                                </div>
                                            </div>
                                            <div className="user-statistic-prize-tooltip-champion-item">
                                                <i className="fas fa-medal"></i>
                                                <div>
                                                    <strong>Quán Quân Tháng:</strong>
                                                    <p>Đạt rank 1 vào cuối tháng trên bảng xếp hạng KN hoặc Thời gian học</p>
                                                </div>
                                            </div>
                                            <div className="user-statistic-prize-tooltip-champion-item">
                                                <i className="fas fa-trophy-alt"></i>
                                                <div>
                                                    <strong>Quán Quân Năm:</strong>
                                                    <p>Đạt rank 1 vào cuối năm trên bảng xếp hạng KN hoặc Thời gian học</p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="user-statistic-prize-tooltip-note champion-note">
                                            <i className="fas fa-star"></i> 
                                            Mỗi giải chỉ đạt được 1 lần duy nhất trong đời! Cạnh tranh gay gắt để giành danh hiệu cao quý này!
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
        </div>
    );
};

export default Statistic;