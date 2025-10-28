import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setLanguage } from "@/store/language/languageSlice";
import { UserSettingService } from "@/services/UserSettingService.jsx";

const GeneralSetting = () => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const currentLanguage = useSelector((state) => state.language.current);

    const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
    const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
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
                    setSelectedLanguage(data.language ?? currentLanguage);
                    setTimezone(data.timezone ?? "Asia/Ho_Chi_Minh");
                }
            } catch (err) {
                console.error("Cannot load general settings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [currentLanguage]);

    const handleSave = async () => {
        const payload = { dateFormat, language: selectedLanguage, timezone };
        try {
            await UserSettingService.updateUserSettingsSection("general", payload);
            dispatch(setLanguage(selectedLanguage));
            Swal.fire({
                icon: "success",
                title: t("setting.successSave"),
                text: t("setting.generalDesc"),
                timer: 2000,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error("Error saving general settings:", err);
            Swal.fire({
                icon: "error",
                title: t("setting.errorSave"),
                text: t("setting.errorSave"),
            });
        }
    };

    if (loading) return <div>{t("setting.loading") ?? "Đang tải cài đặt..."}</div>;

    return (
        <div className="setting-content">
            <h3 className="setting-section-title">{t("setting.generalSettings")}</h3>
            <p className="setting-section-desc">{t("setting.generalDesc")}</p>
            <div className="setting-general-card">
                <div className="setting-general-row">
                    <label className="setting-general-label">
                        <i className="fas fa-calendar-alt"></i> {t("setting.dateFormat")}
                    </label>
                    <select
                        className="setting-general-select"
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                    >
                        {dateFormats.map((f) => (
                            <option key={f} value={f}>{f}</option>
                        ))}
                    </select>
                </div>
                <div className="setting-general-row">
                    <label className="setting-general-label">
                        <i className="fas fa-language"></i> {t("setting.language")}
                    </label>
                    <div className="setting-general-language">
                        {languages.map((lang) => (
                            <label
                                key={lang.value}
                                className={`setting-general-lang-option ${selectedLanguage === lang.value ? "active" : ""}`}
                            >
                                <input
                                    type="radio"
                                    name="language"
                                    value={lang.value}
                                    checked={selectedLanguage == lang.value}
                                    onChange={() => setSelectedLanguage(lang.value)}
                                />
                                <img src={lang.flag} alt={lang.label} />
                                <span>{lang.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="setting-general-row">
                    <label className="setting-general-label">
                        <i className="fas fa-clock"></i> {t("setting.timezone")}
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
                        <i className="fas fa-save"></i> {t("setting.saveChanges")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneralSetting;