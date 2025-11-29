import React, { useEffect, useState } from "react";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import JourneyCard from "@/components/user/journey/JourneyCard.jsx";
import { JourneyService } from "@/services/JourneyService.jsx";

function Journey() {
    const [journeys, setJourneys] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = "Hành Trình Học Tập - EasyTalk";
        const loadJourney = async () => {
            setIsLoading(true);
            try {
                const data = await JourneyService.fetchJourney();
                setJourneys(data.journeys || []);
            } catch (error) {
                console.error("Lỗi khi tải hành trình:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadJourney();
    }, []);

    return (
        <div className="user-journey-container container">
            <div className="user-journey-header">
                <h2 className="user-journey-title">
                    HÀNH TRÌNH HỌC TẬP CỦA BẠN
                </h2>
                <p className="user-journey-subtitle">
                    Chọn một lộ trình để bắt đầu chinh phục tiếng Anh
                </p>
            </div>
            <div className="user-journey-list">
                {journeys.length > 0 ? (
                    journeys.map((j) => (
                        <JourneyCard key={j._id} id={j._id} title={j.title} progress={j.progressPercentage || 0} />
                    ))
                ) : (
                    <p className="user-journey-empty">Chưa có hành trình nào.</p>
                )}
            </div>
            {isLoading && <LoadingScreen />}
        </div>
    );
}

export default Journey;