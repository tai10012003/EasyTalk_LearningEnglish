import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { UserSettingService } from "@/services/UserSettingService.jsx";

const NotificationSetting = () => {
    const { t, i18n } = useTranslation();
    const [notifications, setNotifications] = useState({});
    const [loading, setLoading] = useState(true);

    const notificationTypes = [
        { id: "email", label: t("setting.notifications.title1"), desc: t("setting.notifications.description1"), icon: "fa-envelope", color: "#007bff" },
        { id: "push", label: t("setting.notifications.title2"), desc: t("setting.notifications.description2"), icon: "fa-bell", color: "#17a2b8" },
        { id: "reminder", label: t("setting.notifications.title3"), desc: t("setting.notifications.description3"), icon: "fa-clock", color: "#f97316" },
        { id: "info", label: t("setting.notifications.title4"), desc: t("setting.notifications.description4"), icon: "fa-info-circle", color: "#17a2b8" },
        { id: "promo", label: t("setting.notifications.title5"), desc: t("setting.notifications.description5"), icon: "fa-gift", color: "#e83e8c" },
        { id: "success", label: t("setting.notifications.title6"), desc: t("setting.notifications.description6"), icon: "fa-check-circle", color: "#28a745" },
        { id: "warning", label: t("setting.notifications.title7"), desc: t("setting.notifications.description7"), icon: "fa-exclamation-triangle", color: "#ffc107" },
        { id: "system", label: t("setting.notifications.title8"), desc: t("setting.notifications.description8"), icon: "fa-cogs", color: "#6c757d" },
        { id: "update", label: t("setting.notifications.title9"), desc: t("setting.notifications.description9"), icon: "fa-sync-alt", color: "#007bff" },
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
                title: t("setting.notifications.successTitle"),
                text: t("setting.notifications.successSave"),
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error("Lỗi khi lưu cài đặt thông báo:", err);
            Swal.fire({
                icon: "error",
                title: t("setting.notifications.errorTitle"),
                text: t("setting.notifications.errorSave"),
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
            title: t("setting.notifications.resetTitle"),
            text: t("setting.notifications.resetText"),
            timer: 1500,
            showConfirmButton: false
        });
    };

    if (loading) {
        return <div className="setting-loading">{t("setting.notifications.loading")}</div>;
    }

    return (
        <div className="setting-notification-container">
            <h3 className="setting-notification-title">{t("setting.notifications.title")}</h3>
            <p className="setting-notification-desc">
                {t("setting.notifications.description")}
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
                    <i className="fas fa-save"></i> {t("setting.notifications.saveChanges")}
                </button>
                <button className="setting-notification-btn-reset" onClick={handleReset}>
                    <i className="fas fa-undo"></i> {t("setting.notifications.resetDefault")}
                </button>
            </div>
        </div>
    );
};

export default NotificationSetting;