import React from "react";
import Swal from "sweetalert2";
import { ReminderService } from "@/services/ReminderService.jsx";

const ReminderCard = ({ reminder, onEdit, onDeleted }) => {
    const handleDelete = async () => {
        const result = await Swal.fire({
            icon: "warning",
            title: "Bạn có chắc?",
            text: "Bạn có muốn xóa nhắc nhở này không?",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        });
        if (result.isConfirmed) {
            try {
                await ReminderService.deleteReminder(reminder._id);
                Swal.fire({ icon: "success", title: "Nhắc nhở đã bị xóa thành công!", timer: 1200, showConfirmButton: false });
                onDeleted && onDeleted();
            } catch (err) {
                console.error("Delete reminder error:", err);
                Swal.fire({ icon: "error", title: "Lỗi", text: "Không thể xóa nhắc nhở." });
            }
        }
    };

    return (
        <div className="col-md-4 col-lg-4 mb-4">
            <div className={`reminder-card`}>
                <div className="reminder-card-header">
                    <p className="reminder-info"><strong>Email:</strong> {reminder.email}</p>
                    <p className="reminder-info"><strong>Thời gian:</strong> {new Date(reminder.reminderTime).toLocaleString()}</p>
                    <p className="reminder-info"><strong>Tần suất:</strong> {reminder.frequency}</p>
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
                        <strong>Nội dung nhắc nhở:</strong> {reminder.additionalInfo || "Nhắc nhở"}
                    </h5>
                </div>
            </div>
        </div>
    );
};

export default ReminderCard;