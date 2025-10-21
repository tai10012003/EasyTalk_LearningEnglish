import React, { useEffect, useState } from "react";
import AddReminder from "@/components/user/reminder/AddReminder.jsx";
import UpdateReminder from "@/components/user/reminder/UpdateReminder.jsx";
import ReminderCard from "@/components/user/reminder/ReminderCard.jsx";
import { ReminderService } from "@/services/ReminderService.jsx";
import LoadingScreen from "@/components/user/LoadingScreen.jsx";
import Swal from "sweetalert2";

function Reminder() {
    const [reminders, setReminders] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [showUpdate, setShowUpdate] = useState(false);
    const [selectedReminder, setSelectedReminder] = useState(null);

    const loadReminders = async () => {
        setIsLoading(true);
        try {
            const data = await ReminderService.fetchReminders();
            const list = Array.isArray(data) ? data : (data.reminders || data);
            setReminders(list || []);
        } catch (err) {
            console.error("Load reminders error:", err);
            Swal.fire({ icon: "error", title: "Lỗi", text: "Không thể tải nhắc nhở." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadReminders();
    }, []);

    const handleCreated = () => loadReminders();
    const handleUpdated = () => loadReminders();
    const handleDeleted = () => loadReminders();

    const openUpdate = (reminder) => {
        setSelectedReminder(reminder);
        setShowUpdate(true);
    };

    if (isLoading) return <LoadingScreen />;
    
    return (
        <>
            <div className="lesson-container">
                <div className="hero-mini">
                    <h3 className="hero-title">NHẮC NHỞ HỌC TẬP CỦA BẠN
                    <i
                        className="fas fa-question-circle help-icon"
                        style={{ cursor: "pointer" }}
                        onClick={() => setIsModalOpen(true)}
                    ></i></h3>
                </div>
                <div className="container">
                    <div className="lesson-list">
                        <button className="btn_1" onClick={() => setShowAdd(true)}>
                            <i className="fas fa-plus"></i> Thêm nhắc nhở
                        </button>
                    </div>
                    { reminders.length > 0 ? (
                        <div className="container">
                            <div className="row">
                                {reminders.map((r) => (
                                    <ReminderCard key={r._id} reminder={r} onEdit={openUpdate} onDeleted={handleDeleted} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center no-stories">Chưa có nhắc nhở nào. Hãy thêm nhắc nhở để hệ thống gửi email nhắc bạn</p>
                    )}
                    <nav aria-label="Page navigation">
                        <ul className="pagination justify-content-center" id="pagination-controls">
                            {/* {renderPagination()} */}
                        </ul>
                    </nav>
                </div>
                <AddReminder isOpen={showAdd} onClose={() => setShowAdd(false)} onCreated={handleCreated} />
                <UpdateReminder
                    isOpen={showUpdate}
                    onClose={() => { setShowUpdate(false); setSelectedReminder(null); }}
                    onUpdated={handleUpdated}
                    reminder={selectedReminder}
                />
            </div>
            {isModalOpen && (
                <div className="custom-modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div
                        className="custom-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="custom-modal-header">
                            <h5>Hướng Dẫn Sử Dụng Nhắc Nhở Học Tập</h5>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                                &times;
                            </button>
                        </div>
                        <div className="custom-modal-body">
                            <p>Phần Nhắc nhở giúp bạn quản lý lịch học và nhận email thông báo đúng thời gian.</p>
                            <p><strong>Các chức năng chính:</strong></p>
                            <ul>
                                <li><strong>Thêm nhắc nhở:</strong> Nhấn nút <strong>Thêm nhắc nhở</strong> để tạo mới, nhập email, thời gian và tần suất (Hàng ngày, Hàng tuần, Hàng tháng).</li>
                                <li><strong>Chỉnh sửa nhắc nhở:</strong> Nhấn biểu tượng <i className="fas fa-edit"></i> trên card nhắc nhở để cập nhật thông tin.</li>
                                <li><strong>Xóa nhắc nhở:</strong> Nhấn biểu tượng <i className="fas fa-trash"></i> trên card nhắc nhở để xóa nhắc nhở không cần thiết.</li>
                                <li><strong>Danh sách nhắc nhở:</strong> Xem tất cả nhắc nhở đã tạo và kiểm tra email, thời gian, tần suất.</li>
                            </ul>
                            <p><strong>Lưu ý:</strong></p>
                            <ul>
                                <li>Nhắc nhở sẽ gửi email đúng thời gian và tần suất bạn đã chọn.</li>
                                <li>Có thể xóa hoặc chỉnh sửa bất kỳ nhắc nhở nào nếu thông tin không còn phù hợp.</li>
                                <li>Hãy đảm bảo email nhập đúng để nhận thông báo.</li>
                            </ul>
                            <p>🎯 Sử dụng nhắc nhở để duy trì thói quen học tập hiệu quả!</p>
                        </div>
                        <div className="custom-modal-footer">
                            <button className="footer-btn" onClick={() => setIsModalOpen(false)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default Reminder;