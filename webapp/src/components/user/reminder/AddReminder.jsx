import React, { useState } from "react";
import { ReminderService } from "@/services/ReminderService.jsx";
import Swal from "sweetalert2";

const AddReminder = ({ isOpen, onClose, onCreated }) => {
    const [email, setEmail] = useState("");
    const [reminderTime, setReminderTime] = useState("");
    const [frequency, setFrequency] = useState("Once");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setEmail("");
        setReminderTime("");
        setFrequency("Once");
        setAdditionalInfo("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) {
            Swal.fire({ icon: "warning", title: "Chú ý!", text: "Vui lòng nhập email!" });
            return;
        }
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
            const payload = { email, reminderTime, frequency, additionalInfo };
            const data = await ReminderService.addReminder(payload);
            await Swal.fire({ icon: "success", title: "Thành công!", text: "Nhắc nhở đã được thêm thành công!" });
            resetForm();
            onCreated && onCreated();
            onClose && onClose();
        } catch (err) {
            console.error("Add reminder error:", err);
            Swal.fire({ icon: "error", title: "Lỗi", text: err.message || "Không thể tạo nhắc nhở." });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                <div className="custom-modal-header">
                    <h5>THÊM NHẮC NHỞ HỌC TẬP</h5>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="custom-modal-body">
                        <div className="mb-3">
                            <label className="form-label">Email nhận thông báo:</label>
                            <input
                                type="email"
                                className="form-control"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="vd: you@example.com"
                                required
                            />
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
                            <i className="fas fa-times"></i> Đóng
                        </button>
                        <button type="submit" className="footer-btn" disabled={loading}>
                            <i className="fas fa-save"></i> {loading ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddReminder;