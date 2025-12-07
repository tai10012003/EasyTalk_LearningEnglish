import React, { useState, useEffect } from "react";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import { PrizeService } from "@/services/PrizeService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import * as XLSX from "xlsx";
import PptxGenJS from "pptxgenjs";
import Swal from "sweetalert2";
import StatisticChart from "@/components/user/statistic/StatisticChart";
import StatisticAchievements from "@/components/user/statistic/StatisticAchievements";
import StatisticPrizes from "@/components/user/statistic/StatisticPrizes";

const Statistic = () => {
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
    const [championStats, setChampionStats] = useState({ week: 0, month: 0, year: 0, total: 0 });
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

    const fetchChampionStats = async () => {
        try {
            const stats = await UserProgressService.getChampionStats();
            setChampionStats(stats);
        } catch (err) {
            setChampionStats({ week: 0, month: 0, year: 0, total: 0 });
        }
    };

    useEffect(() => {
        fetchStats();
        fetchPrizes();
        fetchChampionStats();
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
                onExportExcel={exportExcel}
                onExportPpt={exportPpt}
                periods={periods}
            />
            <StatisticAchievements
                streak={streak}
                maxStreak={maxStreak}
                currentUser={currentUser}
                maxDailyExp={maxDailyExp}
                unlockedGates={unlockedGates}
                unlockedStages={unlockedStages}
                unlockedGrammar={unlockedGrammar}
                unlockedPronunciation={unlockedPronunciation}
                unlockedVocab={unlockedVocab}
                unlockedGrammarPractice={unlockedGrammarPractice}
                unlockedPronunciationPractice={unlockedPronunciationPractice}
                unlockedDictation={unlockedDictation}
            />
            <StatisticPrizes
                prizesLoading={prizesLoading}
                allPrizes={allPrizes}
                userPrizes={userPrizes}
                championStats={championStats}
                isPrizeUnlocked={isPrizeUnlocked}
                getPrizesByType={getPrizesByType}
            />
        </div>
    );
};

export default Statistic;