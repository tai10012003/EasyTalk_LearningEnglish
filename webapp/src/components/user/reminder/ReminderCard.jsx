import React from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { ReminderService } from "@/services/ReminderService.jsx";

const ReminderCard = ({ reminder, onEdit, onDeleted }) => {
    const { t, i18n } = useTranslation();
    const frequencyLabel = {
        "one-time": t("reminderPage.frequency.oneTime"),
        daily: t("reminderPage.frequency.daily"),
        weekly: t("reminderPage.frequency.weekly"),
        monthly: t("reminderPage.frequency.monthly")
    }[reminder.frequency] || t("reminderPage.frequency.monthly");

    const handleDelete = async () => {
        const result = await Swal.fire({
            icon: "warning",
            title: t("reminderPage.delete.confirmTitle"),
            text: t("reminderPage.delete.confirmText"),
            showCancelButton: true,
            confirmButtonText: t("reminderPage.delete.confirmButton"),
            cancelButtonText: t("reminderPage.delete.cancelButton"),
        });
        if (result.isConfirmed) {
            try {
                await ReminderService.deleteReminder(reminder._id);
                Swal.fire({ icon: "success", title: t("reminderPage.delete.successTitle"), timer: 1200, showConfirmButton: false });
                onDeleted && onDeleted();
            } catch (err) {
                console.error("Delete reminder error:", err);
                Swal.fire({ icon: "error", title: t("reminderPage.alert.errorTitle"), text: t("reminderPage.alert.deleteFailed") });
            }
        }
    };

    return (
        <div className="col-md-4 col-lg-4 mb-4">
            <div className={`reminder-card`}>
                <div className="reminder-card-header">
                    <p className="reminder-info"><strong>{t("reminderPage.card.email")}:</strong> {reminder.email}</p>
                    <p className="reminder-info"><strong>{t("reminderPage.card.time")}:</strong> {new Date(reminder.reminderTime).toLocaleString(i18n.language === "en" ? "en-US" : "vi-VN")}</p>
                    <p className="reminder-info"><strong>{t("reminderPage.card.frequency")}: </strong> 
                        {frequencyLabel}
                    </p>
                    <div className="reminder-actions">
                        <button className="edit-btn" onClick={() => onEdit(reminder)}>
                            <i className="fas fa-edit"></i>
                        </button>
                        <button className="delete-btn" onClick={handleDelete}>
                            <i className="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div className="reminder-card-body">
                    <h5 className="reminder-title">
                        <strong>{t("reminderPage.card.content")}:</strong> {reminder.additionalInfo || t("reminderPage.card.defaultContent")}
                    </h5>
                </div>
            </div>
        </div>
    );
};

export default ReminderCard;
