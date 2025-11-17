import React, { useState, useEffect } from "react";
import { ReminderService } from "@/services/ReminderService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const UpdateReminder = ({ isOpen, onClose, onUpdated, reminder }) => {
    const [userEmail, setUserEmail] = useState("");
    const [reminderTime, setReminderTime] = useState("");
    const [frequency, setFrequency] = useState("Once");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        if (isOpen) {
            const currentUser = AuthService.getCurrentUser();
            setUserEmail(currentUser?.email);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && reminder) {
            setUserEmail(reminder.email || "");
            if (reminder.reminderTime) {
                const d = new Date(reminder.reminderTime);
                const pad = (n) => String(n).padStart(2, "0");
                const local = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                setReminderTime(local);
            } else {
                setReminderTime("");
            }
            setFrequency(reminder.frequency || "Once");
            setAdditionalInfo(reminder.additionalInfo || "");
        }
    }, [isOpen, reminder]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reminderTime) {
            Swal.fire({ icon: "warning", title: "Chú ý!", text: "Vui lòng chọn thời gian nhắc!" });
            return;
        }
        const selected = new Date(reminderTime).getTime();
        if (isNaN(selected) || selected < Date.now()) {
            Swal.fire({ icon: "warning", title: "Chú ý!", text: "Thời gian nhắc không được ở quá khứ!" });
            return;
        }
        setLoading(true);
        try {
            const payload = { email: userEmail, reminderTime, frequency, additionalInfo };
            const data = await ReminderService.updateReminder(reminder._id, payload);
            await Swal.fire({ icon: "success", title: "Thành công!", text: "Nhắc nhở đã được cập nhật thành công!" });
            onUpdated && onUpdated();
            onClose && onClose();
        } catch (err) {
            console.error("Update reminder error:", err);
            Swal.fire({ icon: "error", title: "Lỗi", text: err.message || "Không thể cập nhật." });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                <div className="custom-modal-header">
                    <h5>CẬP NHẬT NHẮC NHỞ</h5>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="custom-modal-body">
                        <div className="mb-3">
                            <label className="form-label">Email nhận thông báo:</label>
                            <div className="form-control">
                                {userEmail}
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Thời gian nhắc (local):</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Tần suất:</label>
                            <select
                                className="form-select select-colored"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                required
                            >
                                <option value="Once">Một lần</option>
                                <option value="Daily">Hàng ngày</option>
                                <option value="Weekly">Hàng tuần</option>
                                <option value="Monthly">Hàng tháng</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Ghi chú / nội dung nhắc:</label>
                            <textarea
                                className="form-control"
                                rows="4"
                                value={additionalInfo}
                                onChange={(e) => setAdditionalInfo(e.target.value)}
                                placeholder="Ví dụ: Học 30 phút grammar, nghe, đọc..."
                            />
                        </div>
                    </div>
                    <div
                        className="custom-modal-footer"
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <button type="button" className="footer-btn" onClick={onClose} disabled={loading}>
                            <i className="fas fa-times"></i>Đóng
                        </button>
                        <button type="submit" className="footer-btn" disabled={loading}>
                            <i className="fas fa-save"></i>{loading ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UpdateReminder;