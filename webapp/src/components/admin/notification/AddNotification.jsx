import React, { useState, useEffect } from "react";
import { NotificationService } from "@/services/NotificationService.jsx";
import { UserService } from "@/services/UserService.jsx";
import Swal from "sweetalert2";

const AddNotification = ({ isOpen, onClose, onCreated }) => {
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("info");
    const [link, setLink] = useState("");
    const [userId, setUserId] = useState("");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchAllUsers = async () => {
        try {
            let allUsers = [];
            let page = 1;
            let totalPages = 1;
            do {
                const res = await UserService.fetchUser(page, 100);
                const usersOnly = (res.data || []).filter(u => u.role == 'user');
                allUsers = allUsers.concat(usersOnly);
                totalPages = res.totalPages || 1;
                page++;
            } while (page <= totalPages);
            setUsers(allUsers);
        } catch (err) {
            console.error("Error loading all users:", err);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        fetchAllUsers();
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !message.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Chú ý!",
                text: "Tiêu đề và nội dung không được bỏ trống!",
            });
            return;
        }
        setLoading(true);
        try {
            const payload = {
                user: userId || null,
                title: title.trim(),
                message: message.trim(),
                type,
                link: link.trim() || null,
            };
            const data = await NotificationService.createNotification(payload);
            if (data.notification || data.notificationId || data.message) {
                const successMsg = userId ? "Đã tạo thông báo cho 1 người dùng!" : `Đã tạo thông báo cho tất cả người dùng!`;
                Swal.fire({
                    icon: "success",
                    title: "Thành công!",
                    text: successMsg,
                    timer: 2000,
                    showConfirmButton: false,
                });
                setTitle("");
                setMessage("");
                setType("info");
                setLink("");
                setUserId("");
                onCreated();
                onClose();
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Thất bại!",
                    text: data.message || "Không xác định.",
                });
            }
        } catch (err) {
            console.error("Error creating notification:", err);
            Swal.fire({
                icon: "error",
                title: "Lỗi!",
                text: "Lỗi khi tạo thông báo: " + err.message,
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                <div className="custom-modal-header">
                    <h5>THÊM THÔNG BÁO MỚI</h5>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="custom-modal-body">
                        <div className="mb-3">
                            <label className="form-label">
                                Tiêu đề: <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Nhập tiêu đề thông báo"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">
                                Nội dung: <span style={{ color: 'red' }}>*</span>
                            </label>
                            <textarea
                                className="form-control"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={4}
                                placeholder="Nhập nội dung thông báo"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Loại thông báo:</label>
                            <select
                                className="form-select select-colored"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                            >
                                <option value="info">📋 Thông tin (Info)</option>
                                <option value="success">✅ Thành công (Success)</option>
                                <option value="warning">⚠️ Cảnh báo (Warning)</option>
                                <option value="promo">🎁 Khuyến mãi (Promo)</option>
                                <option value="system">⚙️ Hệ thống (System)</option>
                                <option value="update">🔄 Cập nhật (Update)</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Link (tùy chọn):</label>
                            <input
                                type="text"
                                className="form-control"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="https://example.com"
                            />
                            <small className="text-muted">Để trống nếu không cần link</small>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Gửi đến người dùng:</label>
                            <select
                                className="form-select select-colored"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                            >
                                <option value="">🌐 Gửi cho tất cả người dùng</option>
                                {users.map((u) => (
                                    <option key={u._id} value={u._id}>
                                        👤 {u.username || u.email}
                                    </option>
                                ))}
                            </select>
                            <small className="text-muted">
                                {userId 
                                    ? " ✓ Sẽ gửi cho 1 người dùng đã chọn" 
                                    : " ✓ Sẽ gửi cho tất cả người dùng trong hệ thống"
                                }
                            </small>
                        </div>
                    </div>
                    <div className="custom-modal-footer" style={{ display: "flex", justifyContent: "space-between" }}>
                        <button
                            type="button"
                            className="footer-btn"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Đóng
                        </button>
                        <button
                            type="submit"
                            className="footer-btn"
                            disabled={loading}
                            style={{ backgroundColor: loading ? '#ccc' : '' }}
                        >
                            {loading ? "⏳ Đang lưu..." : "💾 Tạo thông báo"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddNotification;