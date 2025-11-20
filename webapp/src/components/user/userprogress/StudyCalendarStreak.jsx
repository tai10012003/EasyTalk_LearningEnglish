import React, { useState } from "react";

function StudyCalendarStreak({ studyDates = [] }) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const studiedSet = new Set(
        (studyDates || []).map((d) => new Date(d).toDateString())
    );
    const changeMonth = (offset) => {
        let newMonth = currentMonth + offset;
        let newYear = currentYear;
        if (newMonth < 0) {
            newMonth = 11;
            newYear -= 1;
        } else if (newMonth > 11) {
            newMonth = 0;
            newYear += 1;
        }
        setCurrentMonth(newMonth);
        setCurrentYear(newYear);
    };

    const monthName = new Date(currentYear, currentMonth).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
    });

    return (
        <div className="streak-calendar-wrapper">
            <div className="streak-calendar-header">
                <button onClick={() => changeMonth(-1)} className="streak-nav-btn">‹</button>
                <h3 className="streak-month">{monthName}</h3>
                <button onClick={() => changeMonth(1)} className="streak-nav-btn">›</button>
            </div>
            <div className="streak-weekdays">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="streak-weekday">{d}</div>
                ))}
            </div>
            <div className="streak-calendar">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="streak-day empty"></div>
                ))}
                {daysArray.map((day) => {
                    const dateObj = new Date(currentYear, currentMonth, day);
                    const dateString = dateObj.toDateString();
                    const studied = studiedSet.has(dateString);
                    const isToday = dateString === today.toDateString();
                    if (isToday) {
                        return (
                            <div
                                key={day}
                                className={`streak-day today ${studied ? "studied" : ""}`}
                            >
                                {day}
                                {studied && <span className="streak-fire">🔥</span>}
                            </div>
                        );
                    }
                    if (dateObj < today) {
                        const prev1Obj = new Date(dateObj);
                        prev1Obj.setDate(dateObj.getDate() - 1);
                        const prev2Obj = new Date(dateObj);
                        prev2Obj.setDate(dateObj.getDate() - 2);
                        const prev1Studied = studiedSet.has(prev1Obj.toDateString());
                        const prev2Studied = studiedSet.has(prev2Obj.toDateString());
                        const missed1Day = !studied && prev1Studied;
                        const missed2Days = !studied && !prev1Studied && prev2Studied;
                        return (
                            <div
                                key={day}
                                className={`streak-day 
                                ${studied ? "studied" : ""} 
                                ${missed1Day ? "missed-1day" : ""} 
                                ${missed2Days ? "missed-2days" : ""}`}
                            >
                                {day}
                                {studied && <span className="streak-fire">🔥</span>}
                                {missed1Day && <span className="streak-ice">❄️</span>}
                                {missed2Days && <span className="streak-ice">❄️❄️</span>}
                            </div>
                        );
                    }
                    return (
                        <div key={day} className="streak-day">
                            {day}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default StudyCalendarStreak;