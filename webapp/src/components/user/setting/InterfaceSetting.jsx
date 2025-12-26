import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { UserSettingService } from "@/services/UserSettingService.jsx";

const InterfaceSetting = () => {
    const { t } = useTranslation();
    const [theme, setTheme] = useState("light");
    const [font, setFont] = useState("Inter");
    const [fontSize, setFontSize] = useState(13);
    const [loading, setLoading] = useState(true);

    const fonts = ["Inter", "Roboto", "Open Sans", "Poppins", "Lora"];
    const fontSizes = Array.from({ length: 10 }, (_, i) => i + 11);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await UserSettingService.getUserSettingsSection("interface");
                if (data) {
                    setTheme(data.theme || "light");
                    setFont(data.fontFamily || "Inter");
                    setFontSize(data.fontSize || 13);
                }
            } catch (err) {
                console.error("Không thể tải cài đặt giao diện:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        const payload = {
            theme,
            fontFamily: font,
            fontSize
        };
        try {
            await UserSettingService.updateUserSettingsSection("interface", payload);
            Swal.fire({
                icon: "success",
                title: t("setting.interface.successTitle"),
                text: t("setting.interface.successSave"),
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error("Lỗi lưu cài đặt giao diện:", err);
        }
    };

    if (loading) {
        return <div className="setting-loading">{t("setting.interface.loading")}</div>;
    }

    return (
        <div className="setting-content">
            <h3 className="setting-section-title">{t("setting.interface.title")}</h3>
            <p className="setting-section-desc">
                {t("setting.interface.description")}
            </p>
            <div className="setting-interface-card">
                <div className="setting-interface-row">
                    <label className="setting-interface-label">
                        <i className="fas fa-adjust"></i> {t("setting.interface.theme")}
                    </label>
                    <div className="setting-interface-theme">
                        <label
                            className={`setting-interface-theme-option ${
                                theme == "light" ? "active" : ""
                            }`}
                        >
                            <input
                                type="radio"
                                name="theme"
                                value="light"
                                checked={theme == "light"}
                                onChange={(e) => setTheme(e.target.value)}
                            />
                            <i className="fas fa-sun"></i>
                            <span>{t("setting.interface.light")}</span>
                        </label>
                        <label
                            className={`setting-interface-theme-option ${
                                theme == "dark" ? "active" : ""
                            }`}
                        >
                            <input
                                type="radio"
                                name="theme"
                                value="dark"
                                checked={theme == "dark"}
                                onChange={(e) => setTheme(e.target.value)}
                            />
                            <i className="fas fa-moon"></i>
                            <span>{t("setting.interface.dark")}</span>
                        </label>
                    </div>
                </div>
                <div className="setting-interface-row">
                    <label className="setting-interface-label">
                        <i className="fas fa-font"></i> {t("setting.interface.font")}
                    </label>
                    <select
                        className="setting-interface-select"
                        value={font}
                        onChange={(e) => setFont(e.target.value)}
                    >
                        {fonts.map((f) => (
                            <option key={f} value={f}>
                                {f}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="setting-interface-row">
                    <label className="setting-interface-label">
                        <i className="fas fa-text-height"></i> {t("setting.interface.fontSize")}
                    </label>
                    <select
                        className="setting-interface-select"
                        value={fontSize}
                        onChange={(e) => setFontSize(parseInt(e.target.value))}
                    >
                        {fontSizes.map((size) => (
                            <option key={size} value={size}>
                                {size}px
                            </option>
                        ))}
                    </select>
                </div>
                <div className="setting-interface-action">
                    <button className="setting-btn" onClick={handleSave}>
                        <i className="fas fa-save"></i> {t("setting.interface.saveChanges")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InterfaceSetting;