import React from "react";
import AchievementPanel from "../../components/user/journey/AchievementPanel";
import JourneyCard from "../../components/user/journey/JourneyCard";
import LeaderboardPanel from "../../components/user/journey/LeaderboardPanel";

function Journey() {
    const journeys = [
        { _id: 1, title: "Chặng 1: Làm quen", progress: 35 },
        { _id: 2, title: "Chặng 2: Từ vựng cơ bản", progress: 60 },
        { _id: 3, title: "Chặng 3: Ngữ pháp", progress: 10 },
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
        <div className="container journey-container">
        <div className="row">
            <div className="col-md-3">
            <AchievementPanel achievements={achievements} dailyTasks={dailyTasks} />
            </div>

            <div className="col-md-6">
            <h2 className="text-center mt-5 mb-5">HÀNH TRÌNH HỌC TẬP CỦA BẠN</h2>
            <div className="row justify-content-center">
                {journeys.map((j) => (
                <JourneyCard key={j._id} title={j.title} progress={j.progress} />
                ))}
            </div>
            </div>

            <div className="col-md-3">
            <LeaderboardPanel leaderboard={leaderboard} />
            </div>
        </div>
        </div>
    );
}

export default Journey;
