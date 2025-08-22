import React from "react";

function LeaderboardPanel({ leaderboard }) {
  return (
    <div className="leaderboard-panel">
        <h4>Bảng xếp hạng</h4>
        <table className="leaderboard-table">
            <thead>
                <tr>
                    <th>Người học</th>
                    <th>Điểm KN</th>
                </tr>
            </thead>
            <tbody>
                {leaderboard.map((entry, i) => (
                    <tr key={i}>
                        <td>{entry.username}</td>
                        <td>{entry.experiencePoints}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
}

export default LeaderboardPanel;
