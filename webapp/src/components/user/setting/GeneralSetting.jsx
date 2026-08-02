import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { UserSettingService } from "@/services/UserSettingService.jsx";

const GeneralSetting = () => {
    const { t } = useTranslation();

    const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
    const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
    const [loading, setLoading] = useState(true);

    const dateFormats = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"];
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
                    setTimezone(data.timezone ?? "Asia/Ho_Chi_Minh");
                }
            } catch (err) {
                console.error("Cannot load general settings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        const payload = { dateFormat, timezone };
        try {
            await UserSettingService.updateUserSettingsSection("general", payload);
            Swal.fire({
                icon: "success",
                title: t("setting.general.successTitle"),
                text: t("setting.general.successSave"),
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

    if (loading) return <div>{t("setting.loading")}</div>;

    return (
        <div className="setting-content">
            <h3 className="setting-section-title">{t("setting.general.title")}</h3>
            <p className="setting-section-desc">{t("setting.general.description")}</p>
            <div className="setting-general-card">
                <div className="setting-general-row">
                    <label className="setting-general-label">
                        <i className="fas fa-calendar-alt"></i> {t("setting.general.dateFormat")}
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
                        <i className="fas fa-clock"></i> {t("setting.general.timezone")}
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
                        <i className="fas fa-save"></i> {t("setting.general.saveChanges")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GeneralSetting;