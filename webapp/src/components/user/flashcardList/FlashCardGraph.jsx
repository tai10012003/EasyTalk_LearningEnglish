import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const getVietnamDate = (date) => {
    const vnDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const y = vnDate.getFullYear();
    const m = String(vnDate.getMonth() + 1).padStart(2, '0');
    const d = String(vnDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const FlashCardGraph = ({ dailyReviews }) => {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const today = new Date();

    const dayOfWeek = today.getDay();
    const offsetToMonday = (dayOfWeek == 0 ? -6 : 1 - dayOfWeek);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + offsetToMonday - (51 * 7));

    const monthLabels = [];
    const monthPositions = [];
    let lastMonth = -1;

    for (let week = 0; week < 52; week++) {
        const weekStartDate = new Date(startDate);
        weekStartDate.setDate(startDate.getDate() + week * 7);
        const month = weekStartDate.getMonth();
        const year = weekStartDate.getFullYear();
        const monthNames = t("flashcardPage.graph.months", { returnObjects: true });
        if (month !== lastMonth) {
            const label = `${monthNames[month]}/${year.toString().slice(-2)}`;
            monthLabels.push(label);
            monthPositions.push(week);
            lastMonth = month;
        }
    }

    const visibleDayLabels = t("flashcardPage.graph.days", { returnObjects: true });
    const labels = visibleDayLabels.map((label, idx) => (
        <div key={idx} className="flashcard-contrib-day-label">{label}</div>
    ));

    const allCounts = Object.values(dailyReviews || {});
    const maxCount = Math.max(...allCounts, 1);

    const getColor = (count) => {
        if (count == 0) return '#ebedf0';
        const normalized = count / maxCount;
        const lightness = 90 - (normalized * 70);
        return `hsl(120, 70%, ${lightness}%)`;
    };

    const weeks = [];
    const todayStr = getVietnamDate(new Date());
    for (let week = 0; week < 52; week++) {
        const weekCol = [];
        for (let row = 0; row < 7; row++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + week * 7 + row);
            const dateStr = getVietnamDate(date);
            const count = dailyReviews[dateStr] || 0;
            const color = getColor(count);
            weekCol.push(
                <div
                    key={`${week}-${row}`}
                    className={`flashcard-contrib-square ${dateStr === todayStr ? 'today' : ''}`}
                    style={{ backgroundColor: color }}
                    title={t("flashcardPage.graph.reviewCount", {
                        date: dateStr,
                        count,
                        today: dateStr === todayStr ? t("flashcardPage.graph.todaySuffix") : ""
                    })}
                />
            );
        }
        weeks.push(<div key={week} className="flashcard-contrib-week-column">{weekCol}</div>);
    }

    const legendLevels = [0, 0.25, 0.5, 0.75, 1];
    const legendSamples = legendLevels.map(level => {
        const sampleCount = Math.round(level * maxCount);
        const color = getColor(sampleCount);
        return (
            <div
                key={level}
                className="flashcard-contrib-legend-sample"
                style={{ backgroundColor: color }}
                title={t("flashcardPage.graph.sampleTitle", { count: sampleCount })}
            />
        );
    });

    return (
        <div className="flashcard-contrib-graph">
            <div className="flashcard-contrib-header">
                <div className="flashcard-contrib-labels">{labels}</div>
                <div className="flashcard-contrib-weeks">{weeks}</div>
            </div>
           <div className="flashcard-contrib-months">
                {monthLabels.map((month, idx) => (
                    <div
                        key={idx}
                        className="flashcard-contrib-month-label"
                        style={{
                            marginLeft: `${monthPositions[idx] * (18 + 3)}px`,
                        }}
                    >
                        {month}
                    </div>
                ))}
            </div>
            <div className="flashcard-contrib-legend">
                <span>{t("flashcardPage.graph.less")}</span>
                <div className="flashcard-contrib-legend-samples">{legendSamples}</div>
                <span>{t("flashcardPage.graph.more")}</span>
            </div>
            <div className="flashcard-contrib-legend-today">
                <div className="flashcard-contrib-legend-today-sample"></div>
                <span>{t("flashcardPage.graph.today")}</span>
            </div>
            <a onClick={() => setIsModalOpen(true)} className="flashcard-contrib-footer">{t("flashcardPage.graph.footer")}</a>
            {isModalOpen && (
                <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5>{t("flashcardPage.graph.title")}</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>{t("flashcardPage.graph.intro")}</p>
                            <p>
                                <strong>{t("flashcardPage.graph.howTitle")}</strong>
                            </p>
                            <ul>
                                <li>{t("flashcardPage.graph.rule1")}</li>
                                <li>{t("flashcardPage.graph.rule2")}</li>
                                <li>{t("flashcardPage.graph.rule3")}</li>
                                <ul>
                                    <li>{t("flashcardPage.graph.color0")}</li>
                                    <li>{t("flashcardPage.graph.colorHigh")}</li>
                                    <li>{t("flashcardPage.graph.colorExample")}</li>
                                </ul>
                            </ul>
                            <p><strong>{t("flashcardPage.graph.noteTitle")}</strong></p>
                            <ul>
                                <li>{t("flashcardPage.graph.note1")}</li>
                                <li>{t("flashcardPage.graph.note2")}</li>
                                <li>{t("flashcardPage.graph.note3")}</li>
                            </ul>
                            <p>{t("flashcardPage.graph.closing")}</p>
                        </div>
                        <div className="custom-modal-footer">
                            <button className="footer-btn" onClick={() => setIsModalOpen(false)}>{t("flashcardPage.graph.close")}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlashCardGraph;
