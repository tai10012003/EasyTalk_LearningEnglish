import React, { useState } from "react";

const getVietnamDate = (date) => {
    const vnDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const y = vnDate.getFullYear();
    const m = String(vnDate.getMonth() + 1).padStart(2, '0');
    const d = String(vnDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const FlashCardGraph = ({ dailyReviews }) => {
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
        const monthNames = ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'];
        if (month !== lastMonth) {
            const label = `${monthNames[month]}/${year.toString().slice(-2)}`;
            monthLabels.push(label);
            monthPositions.push(week);
            lastMonth = month;
        }
    }

    const visibleDayLabels = ['T2', '', 'T4', '', 'T6', '', 'CN'];
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
                    title={`${dateStr}: ${count} lần ôn tập ${dateStr === todayStr ? ' (Hôm nay)' : ''}`}
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
                title={`${sampleCount} lần`}
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
                <span>Ít</span>
                <div className="flashcard-contrib-legend-samples">{legendSamples}</div>
                <span>Nhiều</span>
            </div>
            <div className="flashcard-contrib-legend-today">
                <div className="flashcard-contrib-legend-today-sample"></div>
                <span>Hôm nay</span>
            </div>
            <a onClick={() => setIsModalOpen(true)} className="flashcard-contrib-footer">Tìm hiểu cách chúng tôi tính đóng góp</a>
            {isModalOpen && (
                <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5>Cách tính đóng góp ôn tập Flashcard</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>Đồ thị đóng góp hiển thị lịch sử ôn tập flashcard của bạn trong 52 tuần qua. Mỗi ô vuông đại diện cho một ngày, và màu sắc thể hiện số lần bạn đã đánh giá độ khó của flashcard trong ngày đó.</p>
                            <p>
                                <strong>Cách tính:</strong>
                            </p>
                            <ul>
                                <li>Mỗi lần bạn chọn "Dễ", "Thường" hoặc "Khó" cho một flashcard trong phần review của danh sách flashcard do bạn tạo, hệ thống sẽ ghi nhận 1 lần ôn tập cho ngày hôm đó.</li>
                                <li>Chỉ ghi nhận khi bạn ôn tập flashcard của chính mình (trong tab "Dành cho bạn"). Ôn tập flashcard của người khác (tab "Khám phá") không được tính vào đồ thị.</li>
                                <li>Màu sắc của ô vuông dựa trên số lần ôn tập so với ngày có nhiều nhất trong khoảng thời gian hiển thị:</li>
                                <ul>
                                    <li>0 lần: Xám nhạt</li>
                                    <li>Càng gần số lần nhiều nhất: Màu xanh càng đậm (tối)</li>
                                    <li>Ví dụ: Nếu ngày nhiều nhất là 100 lần, thì 100 lần = xanh tối nhất, 50 lần = xanh trung bình, và giảm dần.</li>
                                </ul>
                            </ul>
                            <p><strong>Lưu ý:</strong></p>
                            <ul>
                                <li>Đồ thị được cập nhật hàng ngày dựa trên múi giờ Asia/Ho_Chi_Minh.</li>
                                <li>Tuần bắt đầu từ thứ Hai (T2) và kết thúc vào Chủ Nhật (CN).</li>
                                <li>Nhãn tháng hiển thị để giúp bạn định hướng thời gian. Màu sắc thay đổi tương đối dựa trên dữ liệu hiện tại.</li>
                            </ul>
                            <p>🎉 Hãy duy trì thói quen ôn tập để đồ thị của bạn ngày càng "xanh" hơn!</p>
                        </div>
                        <div className="custom-modal-footer">
                            <button className="footer-btn" onClick={() => setIsModalOpen(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FlashCardGraph;