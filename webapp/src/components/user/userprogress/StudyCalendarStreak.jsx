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

    // format tháng năm
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
                    const date = new Date(currentYear, currentMonth, day).toDateString();
                    const studied = studiedSet.has(date);
                    const isToday = date == today.toDateString();

                    return (
                        <div
                            key={day}
                            className={`streak-day ${studied ? "studied" : ""} ${
                                isToday ? "today" : ""
                            }`}
                        >
                            {day}
                            {studied && <span className="streak-fire">🔥</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default StudyCalendarStreak;