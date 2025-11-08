import React, { useState } from "react";
import Swal from "sweetalert2";

const UserProgressDetail = ({ userProgress }) => {
    const [modalData, setModalData] = useState(null);
    const [modalTitle, setModalTitle] = useState("");

    const handleOpenModal = (title, items) => {
        if (!items || items.length == 0) {
            Swal.fire({
                icon: "info",
                title: "Không có dữ liệu",
                text: "Người dùng chưa mở khóa phần nội dung nào.",
            });
            return;
        }
        setModalTitle(title);
        setModalData(items);
    };

    const handleCloseModal = () => {
        setModalData(null);
        setModalTitle("");
    };

    return (
        <div className="admin-userprogress-detail-container">
            <h1 className="admin-userprogress-detail-title">Tiến trình người dùng</h1>
            <div className="admin-userprogress-detail-section">
                <h3>📅 Số review flashcard mỗi ngày</h3>
                <div className="admin-userprogress-detail-cards">
                    {Object.entries(userProgress?.dailyFlashcardReviews || {}).length > 0 ? (
                        Object.entries(userProgress.dailyFlashcardReviews).map(([date, count]) => (
                            <div key={date} className="admin-userprogress-detail-mini-card">
                                <div className="mini-card-date">{date}</div>
                                <div className="mini-card-value">{count} lần</div>
                            </div>
                        ))
                    ) : (
                        <p>Chưa có dữ liệu review flashcard.</p>
                    )}
                </div>
            </div>
            <div className="admin-userprogress-detail-section">
                <h3>🎯 Mục tiêu review flashcard hằng ngày</h3>
                <div className="admin-userprogress-detail-value">
                    {userProgress?.dailyFlashcardGoal || 0} flashcard/ngày
                </div>
            </div>
            <div className="admin-userprogress-detail-section">
                <h3>🏅 Danh hiệu flashcard đạt được theo tháng</h3>
                <div className="admin-userprogress-detail-cards">
                    {Object.entries(userProgress?.unlockedFlashcardBadges || {}).length > 0 ? (
                        Object.entries(userProgress.unlockedFlashcardBadges).map(([month, badges]) => (
                            <div key={month} className="admin-userprogress-detail-mini-card badge-card">
                                <div className="mini-card-date">{month}</div>
                                <div className="mini-card-badges">
                                    {badges?.length > 0 ? (
                                        badges.map((b, i) => (
                                            <span key={i} className="badge-item">{b}</span>
                                        ))
                                    ) : (
                                        <span className="badge-item">Chưa có danh hiệu</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Chưa có danh hiệu flashcard nào.</p>
                    )}
                </div>
            </div>
            <div className="admin-userprogress-detail-section">
                <h3>🚪 Các phần nội dung đã mở khóa</h3>
                <div className="admin-userprogress-detail-grid">
                    <button
                        onClick={() => handleOpenModal("Cổng học đã mở khóa", userProgress?.gateDetails || [])}
                        className="admin-userprogress-detail-btn"
                    >
                        Cổng học ({userProgress?.gateDetails?.length || 0})
                    </button>
                    <button
                        onClick={() => handleOpenModal("Chặng học đã mở khóa", userProgress?.stageDetails || [])}
                        className="admin-userprogress-detail-btn"
                    >
                        Chặng học ({userProgress?.stageDetails?.length || 0})
                    </button>
                    <button
                        onClick={() => handleOpenModal("Bài học câu chuyện đã mở khóa", userProgress?.storyDetails || [])}
                        className="admin-userprogress-detail-btn"
                    >
                        Câu chuyện ({userProgress?.storyDetails?.length || 0})
                    </button>
                    <button
                        onClick={() => handleOpenModal("Bài học ngữ pháp đã mở khóa", userProgress?.grammarDetails || [])}
                        className="admin-userprogress-detail-btn"
                    >
                        Ngữ pháp ({userProgress?.grammarDetails?.length || 0})
                    </button>
                    <button
                        onClick={() => handleOpenModal("Bài học phát âm đã mở khóa", userProgress?.pronunciationDetails || [])}
                        className="admin-userprogress-detail-btn"
                    >
                        Phát âm ({userProgress?.pronunciationDetails?.length || 0})
                    </button>
                    <button
                        onClick={() =>
                            handleOpenModal("Bài luyện tập ngữ pháp đã mở khóa", userProgress?.grammarExerciseDetails || [])
                        }
                        className="admin-userprogress-detail-btn"
                    >
                        BT Ngữ pháp ({userProgress?.grammarExerciseDetails?.length || 0})
                    </button>
                    <button
                        onClick={() =>
                            handleOpenModal("Bài luyện tập phát âm đã mở khóa", userProgress?.pronunciationExerciseDetails || [])
                        }
                        className="admin-userprogress-detail-btn"
                    >
                        BT Phát âm ({userProgress?.pronunciationExerciseDetails?.length || 0})
                    </button>
                    <button
                        onClick={() =>
                            handleOpenModal("Bài luyện tập từ vựng đã mở khóa", userProgress?.vocabularyExerciseDetails || [])
                        }
                        className="admin-userprogress-detail-btn"
                    >
                        BT Từ vựng ({userProgress?.vocabularyExerciseDetails?.length || 0})
                    </button>
                    <button
                        onClick={() => handleOpenModal("Bài nghe chép chính tả đã mở khóa", userProgress?.dictationExerciseDetails || [])}
                        className="admin-userprogress-detail-btn"
                    >
                        Nghe Chép Chính tả ({userProgress?.dictationExerciseDetails?.length || 0})
                    </button>
                </div>
            </div>
            <div className="admin-userprogress-detail-section">
                <h3>💪 Điểm kinh nghiệm tổng cộng</h3>
                <div className="admin-userprogress-detail-value">
                    {(userProgress?.experiencePoints || 0).toLocaleString()} XP
                </div>
            </div>
            <div className="admin-userprogress-detail-section">
                <h3>🔥 Chuỗi ngày học liên tục</h3>
                <div className="admin-userprogress-detail-value">
                    {userProgress?.streak || 0} ngày (cao nhất: {userProgress?.maxStreak || 0})
                </div>
            </div>
            <div className="admin-userprogress-detail-section">
                <h3>📆 Danh sách ngày có học</h3>
                <div className="admin-userprogress-detail-cards">
                    {userProgress?.studyDates?.length > 0 ? (
                        userProgress.studyDates.map((d, i) => (
                            <div key={i} className="admin-userprogress-detail-mini-card study-card">
                                <div className="mini-card-date">{d}</div>
                            </div>
                        ))
                    ) : (
                        <p>Người dùng chưa học ngày nào.</p>
                    )}
                </div>
            </div>
            {modalData && (
                <div className="admin-userprogress-detail-modal">
                    <div className="admin-userprogress-detail-modal-content">
                        <h3>{modalTitle}</h3>
                        <ul className="admin-userprogress-detail-modal-list">
                            {modalData.map((item, idx) => (
                                <li key={idx} className="admin-userprogress-detail-modal-list-item">
                                    <span className="admin-userprogress-detail-modal-list-index">{idx + 1}.</span>{" "}
                                    {item.name || item.title || "Không rõ tên"}
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={handleCloseModal}
                            className="admin-userprogress-detail-btn-close"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProgressDetail;