import React, { useState, useEffect } from "react";
const API_URL = import.meta.env.VITE_API_URL;
import { UserProgressService } from "@/services/UserProgressService.jsx";
import { PrizeService } from "@/services/PrizeService.jsx";
import { AuthService } from '@/services/AuthService.jsx';
import StatisticChart from "@/components/user/statistic/StatisticChart";
import StatisticAchievements from "@/components/user/statistic/StatisticAchievements";
import StatisticPrizes from "@/components/user/statistic/StatisticPrizes";
import Swal from "sweetalert2";

const UserDetailModal = ({ userId, username, onClose }) => {
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
    const [unlockedStory, setUnlockedStory] = useState(0);
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

    const fetchUserStats = async () => {
        setLoading(true);
        try {
            const progress = await UserProgressService.getUserProgressByUserId(userId);
            if (!progress) {
                Swal.fire({
                    icon: "error",
                    title: "Không tìm thấy dữ liệu",
                    text: "Không thể tải thông tin người dùng này.",
                    timer: 3000,
                });
                setLoading(false);
                return;
            }
            setCurrentUser(progress);
            setStreak(progress?.streak || 0);
            setMaxStreak(progress?.maxStreak || 0);
            const dailyExp = progress?.dailyExperiencePoints || {};
            const maxExp = Math.max(...Object.values(dailyExp).map(v => v || 0), 0);
            setMaxDailyExp(Math.round(maxExp));
            setUnlockedGates(progress?.gateDetails?.length || 0);
            setUnlockedStages(progress?.stageDetails?.length || 0);
            setUnlockedStory(progress?.storyDetails?.length || 0);
            setUnlockedGrammar(progress?.grammarDetails?.length || 0);
            setUnlockedPronunciation(progress?.pronunciationDetails?.length || 0);
            setUnlockedVocab(progress?.vocabularyExerciseDetails?.length || 0);
            setUnlockedGrammarPractice(progress?.grammarExerciseDetails?.length || 0);
            setUnlockedPronunciationPractice(progress?.pronunciationExerciseDetails?.length || 0);
            setUnlockedDictation(progress?.dictationExerciseDetails?.length || 0);
            const data = activeChart === "time" ? progress?.dailyStudyTimes || {}: dailyExp;
            const chartDataArray = Object.entries(data).map(([date, value]) => ({
                date,
                value: value || 0
            }));
            setChartData(chartDataArray);
        } catch (err) {
            console.error("Lỗi tải thông tin người dùng:", err);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể tải thông tin người dùng.",
                timer: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchPrizes = async () => {
        setPrizesLoading(true);
        try {
            const prizes = await PrizeService.getAllPrizes();
            setAllPrizes(prizes);
            const userProgress = await UserProgressService.getUserProgressByUserId(userId);
            setUserPrizes(userProgress?.unlockedPrizes || []);
            const weekCount = (userProgress?.unlockedPrizes || []).filter(p => p.code?.includes('CHAMPION_WEEK')).length;
            const monthCount = (userProgress?.unlockedPrizes || []).filter(p => p.code?.includes('CHAMPION_MONTH')).length;
            const yearCount = (userProgress?.unlockedPrizes || []).filter(p => p.code?.includes('CHAMPION_YEAR')).length;
            setChampionStats({
                week: weekCount,
                month: monthCount,
                year: yearCount,
                total: weekCount + monthCount + yearCount
            });
        } catch (err) {
            console.error("Lỗi tải giải thưởng:", err);
        } finally {
            setPrizesLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUserStats();
            fetchPrizes();
        }
    }, [userId]);

    const getUsername = () => {
        return username;
    };

    const getEmail = () => {
        return currentUser?.userDetails?.email;
    };

    const isPrizeUnlocked = (prizeCode) => {
        return userPrizes.some(up => up.code === prizeCode);
    };

    const getPrizesByType = (type) => {
        return allPrizes.filter(p => p.type === type).sort((a, b) => a.level - b.level);
    };

    const getFullDates = () => {
        const dates = [];
        const today = getVNDate();
        if (period === "week") {
            const dayOfWeek = today.getDay();
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() + diffToMonday);
            const current = new Date(startOfWeek);
            while (current <= today) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        } else if (period === "month") {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const current = new Date(startOfMonth);
            while (current <= today) {
                dates.push(new Date(current));
                current.setDate(current.getDate() + 1);
            }
        } else if (period === "year") {
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
        const fullDates = getFullDates();
        const index = fullDates.findIndex(date => date.getTime() === today.getTime());
        if (index === -1) return null;
        return {
            color: '#ff4d4f',
            width: 2,
            value: index,
            dashStyle: 'Dash',
            zIndex: 10
        };
    };

    const fullDates = getFullDates();

    return (
        <div className="user-detail-modal-overlay" onClick={onClose}>
            <div className="user-detail-modal-container" onClick={e => e.stopPropagation()}>
                <div className="user-detail-modal-header">
                    <h2 className="user-detail-modal-title">
                        <i className="fas fa-user-circle"></i> Thông tin chi tiết: {getUsername()}
                    </h2>
                    <button onClick={onClose} className="user-detail-modal-close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="user-detail-modal-body">
                    {loading ? (
                        <div className="user-statistic-loading">
                            <i className="fas fa-spinner fa-spin"></i> Đang tải dữ liệu...
                        </div>
                    ) : (
                        <>
                            <div className="user-statistic-info-container">
                                <h3 className="user-statistic-info-title">Thông tin cá nhân</h3>
                                <div className="user-statistic-info">
                                    <p><strong>Username:</strong> {getUsername()}</p>
                                    <p><strong>Email:</strong> {getEmail()}</p>
                                </div>
                            </div>
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
                                periods={periods}
                                username={username}
                            />
                            <StatisticAchievements
                                streak={streak}
                                maxStreak={maxStreak}
                                currentUser={currentUser}
                                maxDailyExp={maxDailyExp}
                                unlockedGates={unlockedGates}
                                unlockedStages={unlockedStages}
                                unlockedStory={unlockedStory}
                                unlockedGrammar={unlockedGrammar}
                                unlockedPronunciation={unlockedPronunciation}
                                unlockedVocab={unlockedVocab}
                                unlockedGrammarPractice={unlockedGrammarPractice}
                                unlockedPronunciationPractice={unlockedPronunciationPractice}
                                unlockedDictation={unlockedDictation}
                                username={username}
                            />
                            <StatisticPrizes
                                prizesLoading={prizesLoading}
                                allPrizes={allPrizes}
                                userPrizes={userPrizes}
                                championStats={championStats}
                                isPrizeUnlocked={isPrizeUnlocked}
                                getPrizesByType={getPrizesByType}
                                username={username}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDetailModal;