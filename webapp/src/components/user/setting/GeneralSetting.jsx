import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { UserSettingService } from "@/services/UserSettingService.jsx";
import { useTranslation } from "react-i18next";

const GeneralSetting = () => {
    const { t, i18n } = useTranslation();

    const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
    const [language, setLanguage] = useState("vi");
    const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
    const [loading, setLoading] = useState(true);

    const dateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
    const languages = [
        { value: "vi", label: "Tiếng Việt", flag: "https://flagcdn.com/w40/vn.png" },
        { value: "en", label: "English", flag: "https://flagcdn.com/w40/us.png" },
    ];
    const timezones = [
        "Asia/Ho_Chi_Minh",
        "Asia/Bangkok",
        "Asia/Singapore",
        "Asia/Tokyo",
        "Europe/London",
        "America/New_York",
        "Australia/Sydney",
    ];

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await UserSettingService.getUserSettingsSection("general");
                if (data) {
                    setDateFormat(data.dateFormat ?? "DD/MM/YYYY");
                    setLanguage(data.language ?? "vi");
                    setTimezone(data.timezone ?? "Asia/Ho_Chi_Minh");
                    i18n.changeLanguage(data.language ?? "vi");
                }
            } catch (err) {
                console.error("Không thể tải cài đặt chung:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        i18n.changeLanguage(lang);
    };

    const handleSave = async () => {
        const payload = { dateFormat, language, timezone };
        try {
            await UserSettingService.updateUserSettingsSection("general", payload);
            Swal.fire({
                icon: "success",
                title: t("successSave"),
                text: t("generalDesc"),
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error("Lỗi khi lưu cài đặt chung:", err);
            Swal.fire({
                icon: "error",
                title: t("errorSave"),
                text: t("errorSave"),
            });
        }
    };

    if (loading) {
        return <div className="setting-loading">{t("loading") ?? "Đang tải cài đặt chung..."}</div>;
    }

    return (
        <div className="setting-content">
            <h3 className="setting-section-title">{t("generalSettings")}</h3>
            <p className="setting-section-desc">{t("generalDesc")}</p>
            <div className="setting-general-card">
                <div className="setting-general-row">
                    <label className="setting-general-label">
                        <i className="fas fa-calendar-alt"></i> {t("dateFormat")}
                    </label>
                    <select
                        className="setting-general-select"
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                    >
                        {dateFormats.map((format) => (
                            <option key={format} value={format}>{format}</option>
                        ))}
                    </select>
                </div>
                <div className="setting-general-row">
                    <label className="setting-general-label">
                        <i className="fas fa-language"></i> {t("language")}
                    </label>
                    <div className="setting-general-language">
                        {languages.map((lang) => (
                            <label
                                key={lang.value}
                                className={`setting-general-lang-option ${language == lang.value ? "active" : ""}`}
                            >
                                <input
                                    type="radio"
                                    name="language"
                                    value={lang.value}
                                    checked={language == lang.value}
                                    onChange={() => handleLanguageChange(lang.value)}
                                />
                                <img src={lang.flag} alt={lang.label} />
                                <span>{lang.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="setting-general-row">
                    <label className="setting-general-label">
                        <i className="fas fa-clock"></i> {t("timezone")}
                    </label>
                    <select
                        className="setting-general-select"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                    >
                        {timezones.map((zone) => (
                            <option key={zone} value={zone}>{zone}</option>
                        ))}
                    </select>
                </div>
                <div className="setting-general-action">
                    <button className="setting-btn" onClick={handleSave}>
                        <i className="fas fa-save"></i> {t("saveChanges")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneralSetting;