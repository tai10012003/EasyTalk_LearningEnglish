import React, { useEffect, useState } from "react";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import AchievementPanel from "@/components/user/AchievementPanel.jsx";
import JourneyCard from "@/components/user/journey/JourneyCard.jsx";
import LeaderboardPanel from "@/components/user/LeaderboardPanel.jsx";
import { JourneyService } from "@/services/JourneyService.jsx";

function Journey() {
    const [journeys, setJourneys] = useState([]);
    const [achievements, setAchievements] = useState({
        experiencePoints: 0,
        completedGates: 0,
        completedStages: 0,
    });
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const dailyTasks = [
        "Hoàn thành 1 chặng",
        "Học từ vựng mới: 5 từ",
        "Thực hành 10 phút giao tiếp",
    ];

    useEffect(() => {
        document.title = "Hành Trình - EasyTalk";
        const loadJourney = async () => {
            setIsLoading(true);
            try {
                const data = await JourneyService.fetchJourney();
                if (data) {
                    setJourneys(data.journeys || []);
                    setAchievements({
                        experiencePoints: data.userProgress?.experiencePoints || 0,
                        completedGates: data.completedGates || 0,
                        completedStages: data.completedStages || 0,
                    });
                    setLeaderboard(data.leaderboard || []);
                }
            } catch (error) {
                console.error("Lỗi khi tải hành trình:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadJourney();
    }, []);

    return (
        <section className="your_journey">
            <div className="container">
                <div className="row">
                    <div className="col-sm-6 col-lg-3 col-xl-3">
                        <AchievementPanel achievements={achievements} dailyTasks={dailyTasks} />
                    </div>
                    <div className="col-sm-6 col-lg-6 col-xl-6">
                        <h3 className="your_journey_title">HÀNH TRÌNH HỌC TẬP CỦA BẠN</h3>
                        <div className="row justify-content-center">
                            {journeys.length > 0 ? (
                                journeys.map((j) => (
                                    <JourneyCard
                                        key={j._id}
                                        id={j._id}
                                        title={j.title}
                                        progress={j.progressPercentage || 0}
                                    />
                                ))
                            ) : (
                                <p className="text-center">Chưa có hành trình nào.</p>
                            )}
                        </div>
                    </div>

                    <div className="col-sm-6 col-lg-3 col-xl-3">
                        <LeaderboardPanel leaderboard={leaderboard} />
                    </div>
                </div>
            </div>
            {isLoading && <LoadingScreen />}
        </section>
    );
}

export default Journey;