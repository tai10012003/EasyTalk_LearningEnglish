import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { UserSettingService } from "@/services/UserSettingService.jsx";

const SecuritySetting = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [googleLogin, setGoogleLogin] = useState(true);
    const [loading, setLoading] = useState(true);

    const devices = [
        { id: 1, name: "Chrome - Windows 10", location: "Hà Nội, Việt Nam", lastLogin: "Hôm qua, 20:34" },
        { id: 2, name: "Safari - iPhone 15", location: "TP. Hồ Chí Minh, Việt Nam", lastLogin: "Hôm nay, 08:12" },
    ];

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await UserSettingService.getUserSettingsSection("security");
                if (data) {
                    setTwoFAEnabled(data.twoFA ?? false);
                    setGoogleLogin(data.googleLogin ?? true);
                }
            } catch (err) {
                console.error("Không thể tải cài đặt bảo mật:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        const payload = {
            twoFA: twoFAEnabled,
            googleLogin
        };
        try {
            await UserSettingService.updateUserSettingsSection("security", payload);
            Swal.fire({
                icon: "success",
                title: t("setting.security.successTitle"),
                text: t("setting.security.successSave"),
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error("Lỗi khi lưu cài đặt bảo mật:", err);
        }
    };

    const handleLogoutAll = async () => {
        Swal.fire({
            title: t("setting.security.logoutAllTitle"),
            text: t("setting.security.logoutAllText"),
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: t("setting.security.button5"),
            cancelButtonText: "Hủy"
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: "success",
                    title: t("setting.security.logoutAllSuccessTitle"),
                    text: t("setting.security.logoutAllSuccessText"),
                });
            }
        });
    };

    if (loading) {
        return <div className="setting-loading">{t("setting.security.loading")}</div>;
    }

    return (
        <div className="setting-security-container">
            <div className="setting-security-section">
                <div className="setting-security-header">
                    <i className="fas fa-key"></i>
                    <div>
                        <h3>{t("setting.security.title1")}</h3>
                        <p>{t("setting.security.description1")}</p>
                    </div>
                </div>
                <button
                    className="setting-security-btn"
                    onClick={() => navigate("/change-password")}
                >
                    {t("setting.security.button1")}
                </button>
            </div>
            <div className="setting-security-section">
                <div className="setting-security-header">
                    <i className="fas fa-shield-alt"></i>
                    <div>
                        <h3>{t("setting.security.title2")}</h3>
                        <p>{t("setting.security.description2")}</p>
                    </div>
                </div>
                <label className="setting-security-toggle">
                    <input
                        type="checkbox"
                        checked={twoFAEnabled}
                        onChange={() => setTwoFAEnabled(!twoFAEnabled)}
                    />
                    <span className="setting-security-slider"></span>
                </label>
            </div>
            <div className="setting-security-section">
                <div className="setting-security-header">
                    <i className="fab fa-google"></i>
                    <div>
                        <h3>{t("setting.security.title3")}</h3>
                        <p>{t("setting.security.description3")}</p>
                    </div>
                </div>
                <label className="setting-security-toggle">
                    <input
                        type="checkbox"
                        checked={googleLogin}
                        onChange={() => setGoogleLogin(!googleLogin)}
                    />
                    <span className="setting-security-slider"></span>
                </label>
            </div>
            <div className="setting-security-section">
                <div className="setting-security-header">
                    <i className="fas fa-laptop"></i>
                    <div>
                        <h3>{t("setting.security.title4")}</h3>
                        <p>{t("setting.security.description4")}</p>
                    </div>
                </div>
                <div className="setting-security-device-list">
                    {devices.map((device) => (
                        <div key={device.id} className="setting-security-device">
                            <i className="fas fa-desktop"></i>
                            <div className="setting-security-device-info">
                                <span className="device-name">{device.name}</span>
                                <span className="device-meta">
                                    {device.location} • {device.lastLogin}
                                </span>
                            </div>
                            <button className="setting-security-device-remove">Xóa</button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="setting-security-section logout-all">
                <div className="setting-security-header">
                    <i className="fas fa-sign-out-alt"></i>
                    <div>
                        <h3>{t("setting.security.title5")}</h3>
                        <p>{t("setting.security.description5")}</p>
                    </div>
                </div>
                <button className="setting-security-btn danger" onClick={handleLogoutAll}>
                    {t("setting.security.button5")}
                </button>
            </div>
            <div className="setting-security-footer">
                <button className="setting-btn" onClick={handleSave}>
                    <i className="fas fa-save"></i> {t("setting.security.saveChanges")}
                </button>
            </div>
        </div>
    );
};

export default SecuritySetting;