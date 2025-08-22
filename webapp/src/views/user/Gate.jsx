import React from "react";
import AchievementPanel from "../../components/user/AchievementPanel";
import GateCard from "../../components/user/gate/GateCard";
import LeaderboardPanel from "../../components/user/LeaderboardPanel";

const Gate = () => {
    const gateData = {
        id: "gate1",
        title: "Cổng 1: Khởi động",
            stages: [
            { id: "stage1", title: "Chặng 1: Làm quen", unlocked: true },
            { id: "stage2", title: "Chặng 2: Cơ bản", unlocked: false },
            { id: "stage3", title: "Chặng 3: Giao tiếp", unlocked: false },
            ],
        };

        const dailyTasks = [
            "Hoàn thành 1 chặng",
            "Học từ vựng mới: 5 từ",
            "Thực hành 10 phút giao tiếp",
        ];

        const achievements = {
            experiencePoints: 250,
            completedGates: 5,
            completedStages: 2,
        };

        const leaderboard = [
            { username: "Alice", experiencePoints: 1200 },
            { username: "Bob", experiencePoints: 950 },
            { username: "Charlie", experiencePoints: 800 },
        ];

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
                        <GateCard gate={gateData} />
                    </div>
                    <div className="col-sm-6 col-lg-3 col-xl-3">
                        <LeaderboardPanel leaderboard={leaderboard} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Gate;