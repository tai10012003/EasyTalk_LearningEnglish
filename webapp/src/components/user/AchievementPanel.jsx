import React from "react";

function AchievementPanel({ achievements, dailyTasks }) {
  return (
    <section className="achievement-panel">
        <h4>Thành tích của bạn</h4>
        <ul className="achievement-list">
            <li>Điểm KN: {achievements.experiencePoints}</li>
            <li>Cổng đã hoàn thành: {achievements.completedGates}</li>
            <li>Chặng đã hoàn thành: {achievements.completedStages}</li>
        </ul>
        <hr />
        <h4>Nhiệm vụ hàng ngày</h4>
        <ul className="daily-tasks">
            {dailyTasks.map((task, i) => (
            <li key={i}>
                <i className="fas fa-check-circle"></i> {task}
            </li>
            ))}
        </ul>
        <hr />
        <div className="upgrade-section">
            <h4>Nâng cấp EasyTalk Pro</h4>
            <p>Nâng cấp để có trải nghiệm tốt hơn và truy cập không giới hạn các tính năng.</p>
            <button className="btn btn-info btn-upgrade">Xem chi tiết</button>
        </div>
    </section>
  );
}

export default AchievementPanel;