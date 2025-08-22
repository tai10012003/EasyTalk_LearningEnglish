import React from "react";
import AchievementPanel from "../../components/user/AchievementPanel";
import JourneyCard from "../../components/user/journey/JourneyCard";
import LeaderboardPanel from "../../components/user/LeaderboardPanel";

function Journey() {
    const journeys = [
        { _id: 1, title: "CƠ BẢN", progress: 35 },
        { _id: 2, title: "TRUNG BÌNH", progress: 60 },
        { _id: 3, title: "NÂNG CAO", progress: 10 },
    ];

    const achievements = {
        experiencePoints: 250,
        completedGates: 5,
        completedStages: 2,
    };

    const dailyTasks = [
        "Hoàn thành 1 chặng",
        "Học từ vựng mới: 5 từ",
        "Thực hành 10 phút giao tiếp",
    ];

    const leaderboard = [
        { username: "Alice", experiencePoints: 1200 },
        { username: "Bob", experiencePoints: 950 },
        { username: "Charlie", experiencePoints: 800 },
    ];

    return (
        <section className="your_journey">
            <div className="container">
                <div className="row">
                    <div className="col-sm-6 col-lg-3 col-xl-3">
                        <AchievementPanel achievements={achievements} dailyTasks={dailyTasks} />
                    </div>

                    <div className="col-sm-6 col-lg-6 col-xl-6">
                    <div className="section_tittle">
                        <h3>HÀNH TRÌNH HỌC TẬP CỦA BẠN</h3>
                    </div>
                    <div className="row justify-content-center">
                        {journeys.map((j) => (
                        <JourneyCard key={j._id} title={j.title} progress={j.progress} />
                        ))}
                    </div>
                    </div>

                    <div className="col-sm-6 col-lg-3 col-xl-3">
                        <LeaderboardPanel leaderboard={leaderboard} />
                    </div>
                </div>
            </div>
        </section>
    );
}

export default Journey;