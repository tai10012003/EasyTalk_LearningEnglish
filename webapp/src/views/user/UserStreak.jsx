import React, { useEffect, useState } from "react";
import { UserProgressService } from "../../services/UserProgressService";
import StudyCalendarStreak from "../../components/user/userprogress/StudyCalendarStreak";

function UserStreak() {
    const [streakData, setStreakData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStreak() {
            try {
                const data = await UserProgressService.getUserStreak();
                setStreakData(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchStreak();
    }, []);

    if (loading) return <p className="text-center">Loading streak...</p>;
    if (!streakData)
        return <p className="text-center text-red-500">Failed to load streak data</p>;

    return (
        <div className="streak-container max-w-lg mx-auto mt-10 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-xl">
            <h2 className="streak-title text-2xl font-bold mb-6 text-center text-gray-800">
                🔥 Streak Học Tập Của Bạn
            </h2>
            <div className="streak-stats flex justify-around mb-8">
                <div className="text-center">
                    <p className="text-4xl font-extrabold text-green-600">
                        {streakData.streak}
                    </p>
                    <p className="text-gray-600 font-medium">Streak Hiện Tại</p>
                </div>
                <div className="text-center">
                    <p className="text-4xl font-extrabold text-blue-600">
                        {streakData.maxStreak}
                    </p>
                    <p className="text-gray-600 font-medium">Streak Kỷ Lục</p>
                </div>
            </div>
            <StudyCalendarStreak studyDates={streakData.studyDates} />
        </div>
    );
}

export default UserStreak;