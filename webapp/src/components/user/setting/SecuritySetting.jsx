import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { UserSettingService } from "@/services/UserSettingService.jsx";

const SecuritySetting = () => {
    const navigate = useNavigate();
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
                title: "Đã lưu thành công!",
                text: "Cấu hình bảo mật của bạn đã được cập nhật.",
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error("Lỗi khi lưu cài đặt bảo mật:", err);
        }
    };

    const handleLogoutAll = async () => {
        Swal.fire({
            title: "Xác nhận đăng xuất?",
            text: "Bạn sẽ đăng xuất khỏi tất cả thiết bị khác.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Đăng xuất tất cả",
            cancelButtonText: "Hủy"
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: "success",
                    title: "Đã đăng xuất khỏi tất cả thiết bị!",
                    text: "Vui lòng đăng nhập lại để tiếp tục.",
                });
            }
        });
    };

    if (loading) {
        return <div className="setting-loading">Đang tải cài đặt bảo mật...</div>;
    }

    return (
        <div className="setting-security-container">
            <div className="setting-security-section">
                <div className="setting-security-header">
                    <i className="fas fa-key"></i>
                    <div>
                        <h3>Đổi mật khẩu</h3>
                        <p>Cập nhật mật khẩu của bạn để bảo vệ tài khoản tốt hơn.</p>
                    </div>
                </div>
                <button
                    className="setting-security-btn"
                    onClick={() => navigate("/change-password")}
                >
                    Đổi mật khẩu
                </button>
            </div>
            <div className="setting-security-section">
                <div className="setting-security-header">
                    <i className="fas fa-shield-alt"></i>
                    <div>
                        <h3>Xác thực hai bước (2FA)</h3>
                        <p>Bảo vệ tài khoản bằng cách yêu cầu mã xác minh khi đăng nhập.</p>
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
                        <h3>Đăng nhập nhanh bằng Google</h3>
                        <p>Cho phép đăng nhập tài khoản bằng Google nhanh chóng và an toàn.</p>
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
                        <h3>Thiết bị đang đăng nhập</h3>
                        <p>Kiểm tra và quản lý các thiết bị đang đăng nhập tài khoản của bạn.</p>
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
                        <h3>Đăng xuất khỏi tất cả thiết bị</h3>
                        <p>Thoát tài khoản trên mọi thiết bị đang đăng nhập.</p>
                    </div>
                </div>
                <button className="setting-security-btn danger" onClick={handleLogoutAll}>
                    Đăng xuất tất cả
                </button>
            </div>
            <div className="setting-security-footer">
                <button className="setting-btn" onClick={handleSave}>
                    <i className="fas fa-save"></i> Lưu thay đổi
                </button>
            </div>
        </div>
    );
};

export default SecuritySetting;