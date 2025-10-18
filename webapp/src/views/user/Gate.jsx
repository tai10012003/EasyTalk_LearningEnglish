import React, { useEffect, useState } from "react";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import AchievementPanel from "@/components/user/AchievementPanel.jsx";
import GateCard from "@/components/user/gate/GateCard.jsx";
import LeaderboardPanel from "@/components/user/LeaderboardPanel.jsx";
import { GateService } from "@/services/GateService.jsx";

const Gate = () => {
    const [gates, setGates] = useState([]);
    const [achievements, setAchievements] = useState({});
    const [leaderboard, setLeaderboard] = useState([]);
    const [dailyTasks, setDailyTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = "Cổng hành trình - EasyTalk";
        const fetchJourneyData = async () => {
            setIsLoading(true);
            try {
                const journeyId = window.location.pathname.split("/").pop();
                const data = await GateService.getGate(journeyId);
                if (!data || !data.journey) {
                    console.error("Không tìm thấy journey với id:", journeyId);
                    return;
                }
                const formattedGates = data.journey.gates.map((gate) => ({
                    ...gate,
                    unlocked: data.userProgress.unlockedGates.includes(gate._id),
                    stages: gate.stages.map((stage) => ({
                        id: stage._id,
                        title: stage.title,
                        unlocked: data.userProgress.unlockedStages.includes(stage._id),
                    })),
                }));

                setGates(formattedGates);
                setAchievements({
                    experiencePoints: data.userProgress.experiencePoints,
                    completedGates: data.completedGates,
                    completedStages: data.completedStages,
                });
                setLeaderboard(data.leaderboard);
                setDailyTasks([
                    "Hoàn thành 1 chặng",
                    "Học từ vựng mới: 5 từ",
                    "Thực hành 10 phút giao tiếp",
                ]);
            } catch (error) {
                console.error("Lỗi khi fetch journey data:", error);
            } finally {
                setTimeout(() => setIsLoading(false), 1000); // Tạo cảm giác mượt hơn
            }
        };
        fetchJourneyData();
    }, []);

    return (
        <div className="your_journey">
            <div className="container">
                <div className="row">
                    <div className="col-sm-6 col-lg-3 col-xl-3">
                        <AchievementPanel achievements={achievements} dailyTasks={dailyTasks} />
                    </div>
                    <div className="col-sm-6 col-lg-6 col-xl-6">
                        <div className="section_tittle">
                            <h4 className="journey-title">HÀNH TRÌNH: CƠ BẢN</h4>
                        </div>
                        {gates.map((gate) => (
                            <GateCard key={gate._id} gate={gate} />
                        ))}
                    </div>
                    <div className="col-sm-6 col-lg-3 col-xl-3">
                        <LeaderboardPanel leaderboard={leaderboard} />
                    </div>
                </div>
            </div>
            {isLoading && <LoadingScreen />}
        </div>
    );
};

export default Gate;