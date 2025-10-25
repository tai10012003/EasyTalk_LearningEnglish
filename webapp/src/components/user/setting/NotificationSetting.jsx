import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { UserSettingService } from "@/services/UserSettingService.jsx";

const NotificationSetting = () => {
    const [notifications, setNotifications] = useState({});
    const [loading, setLoading] = useState(true);

    const notificationTypes = [
        { id: "email", label: "Email", desc: "Nhận thông báo qua email", icon: "fa-envelope", color: "#007bff" },
        { id: "push", label: "Push Notification", desc: "Thông báo đẩy trên trình duyệt", icon: "fa-bell", color: "#17a2b8" },
        { id: "reminder", label: "Nhắc học tập", desc: "Gửi nhắc nhở khi đến giờ học", icon: "fa-clock", color: "#f97316" },
        { id: "info", label: "Thông tin", desc: "Tin tức và thông báo chung", icon: "fa-info-circle", color: "#17a2b8" },
        { id: "promo", label: "Khuyến mãi", desc: "Nhận ưu đãi & mã giảm giá", icon: "fa-gift", color: "#e83e8c" },
        { id: "success", label: "Thành công", desc: "Thông báo về hành động thành công", icon: "fa-check-circle", color: "#28a745" },
        { id: "warning", label: "Cảnh báo", desc: "Thông báo cảnh báo về tài khoản hoặc hệ thống", icon: "fa-exclamation-triangle", color: "#ffc107" },
        { id: "system", label: "Hệ thống", desc: "Cập nhật và bảo trì hệ thống", icon: "fa-cogs", color: "#6c757d" },
        { id: "update", label: "Cập nhật", desc: "Thông báo khi có tính năng mới", icon: "fa-sync-alt", color: "#007bff" },
    ];

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await UserSettingService.getUserSettingsSection("notifications");
                if (data) setNotifications(data);
                else {
                    const defaultSettings = {};
                    notificationTypes.forEach(item => {
                        defaultSettings[item.id] = true;
                    });
                    setNotifications(defaultSettings);
                }
            } catch (err) {
                console.error("Không thể tải cài đặt thông báo:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const toggleNotification = (key) => {
        setNotifications((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    const handleSave = async () => {
        try {
            await UserSettingService.updateUserSettingsSection("notifications", notifications);
            Swal.fire({
                icon: "success",
                title: "Đã lưu thành công!",
                text: "Cấu hình thông báo của bạn đã được cập nhật.",
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error("Lỗi khi lưu cài đặt thông báo:", err);
            Swal.fire({
                icon: "error",
                title: "Lỗi!",
                text: "Không thể lưu cài đặt thông báo.",
            });
        }
    };

    const handleReset = () => {
        const defaultSettings = {};
        notificationTypes.forEach(item => {
            defaultSettings[item.id] = true;
        });
        setNotifications(defaultSettings);
        Swal.fire({
            icon: "info",
            title: "Đã khôi phục mặc định!",
            text: "Các tùy chọn thông báo đã được đặt lại.",
            timer: 1500,
            showConfirmButton: false
        });
    };

    if (loading) {
        return <div className="setting-loading">Đang tải cài đặt thông báo...</div>;
    }

    return (
        <div className="setting-notification-container">
            <h3 className="setting-notification-title">Cấu hình thông báo</h3>
            <p className="setting-notification-desc">
                Quản lý cách bạn nhận thông báo từ hệ thống, bao gồm email, đẩy, khuyến mãi và nhắc nhở học tập.
            </p>
            <div className="setting-notification-list">
                {notificationTypes.map((item) => (
                    <div key={item.id} className="setting-notification-item">
                        <div className="setting-notification-info">
                            <i
                                className={`fas ${item.icon} setting-notification-icon`}
                                style={{ color: item.color }}
                            ></i>
                            <div>
                                <h4>{item.label}</h4>
                                <p>{item.desc}</p>
                            </div>
                        </div>
                        <label className="setting-notification-toggle">
                            <input
                                type="checkbox"
                                checked={notifications[item.id]}
                                onChange={() => toggleNotification(item.id)}
                            />
                            <span className="setting-notification-slider"></span>
                        </label>
                    </div>
                ))}
            </div>
            <div className="setting-notification-footer">
                <button className="setting-notification-btn-save" onClick={handleSave}>
                    <i className="fas fa-save"></i> Lưu thay đổi
                </button>
                <button className="setting-notification-btn-reset" onClick={handleReset}>
                    <i className="fas fa-undo"></i> Khôi phục mặc định
                </button>
            </div>
        </div>
    );
};

export default NotificationSetting;