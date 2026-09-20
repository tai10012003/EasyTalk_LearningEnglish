import React, { useEffect, useState } from "react";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import JourneyCard from "@/components/user/journey/JourneyCard.jsx";
import { JourneyService } from "@/services/JourneyService.jsx";
import { useTranslation } from "react-i18next";

function Journey() {
    const { t, i18n } = useTranslation();
    const [journeys, setJourneys] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = t("journeyPage.list.documentTitle");
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
    }, [t, i18n.language]);

    return (
        <div className="user-journey-container container">
            <div className="user-journey-header">
                <h2 className="user-journey-title">
                    {t("journeyPage.list.title")}
                </h2>
                <p className="user-journey-subtitle">
                    {t("journeyPage.list.subtitle")}
                </p>
            </div>
            <div className="user-journey-list">
                {journeys.length > 0 ? (
                    journeys.map((j) => (
                        <JourneyCard key={j._id} id={j._id} title={j.title} progress={j.progressPercentage || 0} />
                    ))
                ) : (
                    <p className="user-journey-empty">{t("journeyPage.list.empty")}</p>
                )}
            </div>
            {isLoading && <LoadingScreen />}
        </div>
    );
}

export default Journey;
