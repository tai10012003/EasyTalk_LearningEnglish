import { AuthService } from "./AuthService.jsx";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL;
let hasShownAlert = false;

export const ReminderService = {
    async fetchReminders() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/reminder/api/reminder-list`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            hasShownAlert = false;
            console.log("Reminders fetched successfully:", data);
            return data.reminders;
        } catch (error) {
            console.error("Error fetching reminders:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể tải danh sách nhắc nhở. Vui lòng kiểm tra kết nối server.",
                });
            }
            return [];
        }
    },

    async addReminder(reminderData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/reminder/api/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reminderData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Đã tạo nhắc nhở mới!",
                timer: 2000,
                showConfirmButton: false,
            });
            return data;
        } catch (error) {
            console.error("Error adding reminder:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể thêm nhắc nhở. Vui lòng thử lại.",
            });
            throw error;
        }
    },

    async updateReminder(id, reminderData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/reminder/api/update/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reminderData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            Swal.fire({
                icon: "success",
                title: "Đã cập nhật",
                text: "Nhắc nhở đã được cập nhật thành công.",
                timer: 2000,
                showConfirmButton: false,
            });
            return data;
        } catch (error) {
            console.error("Error updating reminder:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể cập nhật nhắc nhở.",
            });
            throw error;
        }
    },

    async deleteReminder(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/reminder/api/delete/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            Swal.fire({
                icon: "success",
                title: "Đã xóa",
                text: "Nhắc nhở đã được xóa.",
                timer: 1500,
                showConfirmButton: false,
            });
            return data;
        } catch (error) {
            console.error("Error deleting reminder:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể xóa nhắc nhở.",
            });
            throw error;
        }
    },

    async getReminderById(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/reminder/api/reminder/${id}`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (error) {
            console.error("Error getting reminder detail:", error);
            return null;
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    },
};