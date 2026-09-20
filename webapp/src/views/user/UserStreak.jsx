import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import { UserProgressService } from "@/services/UserProgressService.jsx";
import StudyCalendarStreak from "@/components/user/userprogress/StudyCalendarStreak.jsx";

function UserStreak() {
    const { t, i18n } = useTranslation();
    const [streakData, setStreakData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        document.title = t("streakPage.documentTitle");
        async function fetchStreak() {
            try {
                const data = await UserProgressService.getUserStreak();
                setStreakData(data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchStreak();
    }, [t, i18n.language]);

    if (isLoading) return <LoadingScreen />;
    if (!streakData)
        return <p className="text-center text-red-500 mt-4 mb-4">{t("streakPage.error.loadFailed")}</p>;

    return (
        <div className="streak-container max-w-lg mx-auto mt-10 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-xl">
            <h2 className="streak-title text-2xl font-bold mb-6 text-center text-gray-800">
                🔥 {t("streakPage.title")}
            </h2>
            <div className="streak-stats flex justify-around mb-8">
                <div className="text-center">
                    <p className="text-4xl font-extrabold text-green-600">
                        {streakData.streak}
                    </p>
                    <p className="text-gray-600 font-medium">{t("streakPage.stats.current")}</p>
                </div>
                <div className="text-center">
                    <p className="text-4xl font-extrabold text-blue-600">
                        {streakData.maxStreak}
                    </p>
                    <p className="text-gray-600 font-medium">{t("streakPage.stats.best")}</p>
                </div>
            </div>
            <StudyCalendarStreak studyDates={streakData.studyDates} />
        </div>
    );
}

export default UserStreak;
