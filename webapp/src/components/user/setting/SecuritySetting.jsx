import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { UserSettingService } from "@/services/UserSettingService.jsx";
import { UserService } from "@/services/UserService.jsx";
import { AuthService } from "@/services/AuthService.jsx";

function formatSessionTime(value) {
    if(!value) return "Chưa sử dụng";
    return new Date(value).toLocaleString("vi-VN");
}

function getDeviceName(userAgent = "") {
    if(!userAgent) return "Thiết bị không xác định";
    const browser = userAgent.includes("Edg") ? "Edge"
        : userAgent.includes("Chrome") ? "Chrome"
        : userAgent.includes("Firefox") ? "Firefox"
        : userAgent.includes("Safari") ? "Safari"
        : "Trình duyệt";
    const platform = userAgent.includes("Windows") ? "Windows"
        : userAgent.includes("Mac") ? "macOS"
        : userAgent.includes("Android") ? "Android"
        : userAgent.includes("iPhone") || userAgent.includes("iPad") ? "iOS"
        : "Thiết bị";
    return `${browser} - ${platform}`;
}

const SecuritySetting = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [twoFAEnabled, setTwoFAEnabled] = useState(false);
    const [googleLogin, setGoogleLogin] = useState(true);
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await UserSettingService.getUserSettingsSection("security");
                if (data) {
                    setTwoFAEnabled(data.twoFA ?? false);
                    setGoogleLogin(data.googleLogin ?? true);
                }
                const activeSessions = await UserService.getSessions();
                setSessions(activeSessions);
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
                UserService.revokeAllSessions()
                    .then(() => {
                        Swal.fire({
                            icon: "success",
                            title: t("setting.security.logoutAllSuccessTitle"),
                            text: t("setting.security.logoutAllSuccessText"),
                        }).then(() => AuthService.logout());
                    })
                    .catch((err) => {
                        console.error("Không thể đăng xuất tất cả thiết bị:", err);
                        Swal.fire({
                            icon: "error",
                            title: "Lỗi",
                            text: err.message || "Không thể đăng xuất tất cả thiết bị.",
                        });
                    });
            }
        });
    };

    const handleRemoveSession = async (session) => {
        const result = await Swal.fire({
            title: "Đăng xuất thiết bị?",
            text: session.current
                ? "Đây là thiết bị hiện tại. Bạn sẽ cần đăng nhập lại."
                : "Thiết bị này sẽ bị đăng xuất khỏi tài khoản.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Đăng xuất",
            cancelButtonText: "Hủy"
        });
        if(!result.isConfirmed) return;
        try {
            const data = await UserService.revokeSession(session.sessionId);
            await Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Đã đăng xuất thiết bị.",
                timer: 1500,
                showConfirmButton: false
            });
            if(data?.currentRevoked || session.current) {
                AuthService.logout();
                return;
            }
            setSessions((prev) => prev.filter(item => item.sessionId !== session.sessionId));
        } catch (err) {
            console.error("Không thể đăng xuất thiết bị:", err);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: err.message || "Không thể đăng xuất thiết bị.",
            });
        }
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
                    {sessions.length == 0 && (
                        <div className="setting-security-device">
                            <i className="fas fa-desktop"></i>
                            <div className="setting-security-device-info">
                                <span className="device-name">Không có phiên đăng nhập nào</span>
                                <span className="device-meta">Hãy đăng nhập lại nếu danh sách chưa hiển thị.</span>
                            </div>
                        </div>
                    )}
                    {sessions.map((session) => (
                        <div key={session.sessionId} className="setting-security-device">
                            <i className="fas fa-desktop"></i>
                            <div className="setting-security-device-info">
                                <span className="device-name">
                                    {getDeviceName(session.userAgent)}
                                    {session.current ? " (hiện tại)" : ""}
                                </span>
                                <span className="device-meta">
                                    {session.ipAddress || "Không rõ IP"} • Lần dùng gần nhất: {formatSessionTime(session.lastUsedAt || session.createdAt)}
                                </span>
                            </div>
                            <button
                                className="setting-security-device-remove"
                                onClick={() => handleRemoveSession(session)}
                            >
                                Xóa
                            </button>
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