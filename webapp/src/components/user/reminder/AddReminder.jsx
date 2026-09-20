import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ReminderService } from "@/services/ReminderService.jsx";
import { AuthService } from "@/services/AuthService.jsx";
import Swal from "sweetalert2";

const AddReminder = ({ isOpen, onClose, onCreated }) => {
    const { t } = useTranslation();
    const [userEmail, setUserEmail] = useState("");
    const [reminderTime, setReminderTime] = useState("");
    const [frequency, setFrequency] = useState("one-time");
    const [additionalInfo, setAdditionalInfo] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const currentUser = AuthService.getCurrentUser();
            setUserEmail(currentUser?.email);
        }
    }, [isOpen]);

    const resetForm = () => {
        setReminderTime("");
        setFrequency("one-time");
        setAdditionalInfo("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reminderTime) {
            Swal.fire({ icon: "warning", title: t("reminderPage.alert.noticeTitle"), text: t("reminderPage.alert.timeRequired") });
            return;
        }
        const selected = new Date(reminderTime).getTime();
        if (isNaN(selected) || selected < Date.now()) {
            Swal.fire({ icon: "warning", title: t("reminderPage.alert.noticeTitle"), text: t("reminderPage.alert.timeInPast") });
            return;
        }
        setLoading(true);
        try {
            const payload = { email: userEmail, reminderTime, frequency, additionalInfo };
            await ReminderService.addReminder(payload);
            await Swal.fire({ icon: "success", title: t("reminderPage.alert.successTitle"), text: t("reminderPage.alert.addSuccess") });
            resetForm();
            onCreated && onCreated();
            onClose && onClose();
        } catch (err) {
            console.error("Add reminder error:", err);
            Swal.fire({ icon: "error", title: t("reminderPage.alert.errorTitle"), text: err.message || t("reminderPage.alert.createFailed") });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="custom-modal-overlay" onClick={onClose}>
            <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
                <div className="custom-modal-header">
                    <h5>{t("reminderPage.form.addTitle")}</h5>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="custom-modal-body">
                        <div className="mb-3">
                            <label className="form-label">{t("reminderPage.form.emailLabel")}</label>
                            <div className="form-control">
                                {userEmail}
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">{t("reminderPage.form.timeLabel")}</label>
                            <input
                                type="datetime-local"
                                className="form-control"
                                value={reminderTime}
                                onChange={(e) => setReminderTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">{t("reminderPage.form.frequencyLabel")}</label>
                            <select
                                className="form-select select-colored"
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value)}
                                required
                            >
                                <option value="one-time">{t("reminderPage.frequency.oneTime")}</option>
                                <option value="daily">{t("reminderPage.frequency.daily")}</option>
                                <option value="weekly">{t("reminderPage.frequency.weekly")}</option>
                                <option value="monthly">{t("reminderPage.frequency.monthly")}</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">{t("reminderPage.form.noteLabel")}</label>
                            <textarea
                                className="form-control"
                                rows="4"
                                value={additionalInfo}
                                onChange={(e) => setAdditionalInfo(e.target.value)}
                                placeholder={t("reminderPage.form.notePlaceholder")}
                            />
                        </div>
                    </div>
                    <div
                        className="custom-modal-footer"
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <button type="button" className="footer-btn" onClick={onClose} disabled={loading}>
                            <i className="fas fa-times"></i> {t("reminderPage.common.close")}
                        </button>
                        <button type="submit" className="footer-btn" disabled={loading}>
                            <i className="fas fa-save"></i> {loading ? t("reminderPage.common.saving") : t("reminderPage.common.save")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddReminder;
