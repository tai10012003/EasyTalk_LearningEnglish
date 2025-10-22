import { AuthService } from "./AuthService.jsx";
import Swal from "sweetalert2";
const API_URL = import.meta.env.VITE_API_URL;
let hasShownAlert = false;

export const NotificationService = {
    async fetchUserNotifications() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/notification/api/notifications`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            hasShownAlert = false;
            console.log("User notifications fetched successfully:", data);
            return data.notifications || [];
        } catch (error) {
            console.error("Error fetching user notifications:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể tải danh sách thông báo. Vui lòng kiểm tra kết nối server.",
                });
            }
            return [];
        }
    },

    async fetchAllNotifications() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/notification/api/admin/notifications`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            hasShownAlert = false;
            console.log("All notifications fetched successfully:", data);
            return data.notifications || [];
        } catch (error) {
            console.error("Error fetching all notifications:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể tải danh sách thông báo.",
                });
            }
            return [];
        }
    },

    async createNotification(notificationData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/notification/api/add`, {
                method: "POST",
                body: JSON.stringify(notificationData),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            return data;
        } catch (error) {
            console.error("Error creating notification:", error);
            throw error;
        }
    },

    async deleteNotification(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/notification/api/delete/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            return data;
        } catch (error) {
            console.error("Error deleting notification:", error);
            throw error;
        }
    },

    async getNotificationById(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/notification/api/${id}`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (error) {
            console.error("Error getting notification detail:", error);
            return null;
        }
    },

    async markAsRead(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/notification/api/read/${id}`, {
                method: "PUT",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (error) {
            console.error("Error marking notification as read:", error);
            throw error;
        }
    },

    async markAsUnread(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/notification/api/un-read/${id}`, {
                method: "PUT",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (error) {
            console.error("Error marking notification as read:", error);
            throw error;
        }
    },

    async markAllAsRead() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/notification/api/read-all`, {
                method: "PUT",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            throw error;
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    },
};