const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";

let hasShownAlert = false;
export const UserService = {
    async fetchUser(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.role) query += `&role=${encodeURIComponent(filters.role)}`;
            const res = await AuthService.fetchWithAuth(`${API_URL}/user/api/user-list${query}`, {
                method: 'GET',
            });

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            const data = responseData.data;
            hasShownAlert = false;
            console.log('Fetch success:', data);
            return data;
        } catch (error) {
            console.error("Error fetching user:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
            return { data: [], currentPage: 1, totalPages: 1 };
        }
    },

    async getUserById(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/user/api/${id}`);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = responseData.data;
            return data;
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    },

    async addUser(formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/user/add`, {
                method: "POST",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = responseData.data;
            return await data;
        } catch (err) {
            console.error("Error adding user:", err);
            throw err;
        }
    },

    async updateUser(id, formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/user/update/${id}`, {
                method: "PUT",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = responseData.data;
            return await data;
        } catch (err) {
            console.error("Error updating user:", err);
            throw err;
        }
    },

    async updateProfile(formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/user/profile/update`, {
                method: "PUT",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = responseData.data;
            return await data;
        } catch (err) {
            console.error("Error updating user:", err);
            throw err;
        }
    },

    async getSessions() {
        const res = await AuthService.fetchWithAuth(`${API_URL}/user/sessions`, {
            method: "GET",
        });
        const responseData = await res.json();
        if (!res.ok || !responseData.success) {
            throw new Error(responseData.message || "Không thể tải danh sách thiết bị");
        }
        return responseData.data?.sessions || [];
    },

    async revokeSession(sessionId) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/user/sessions/${sessionId}`, {
            method: "DELETE",
        });
        const responseData = await res.json();
        if (!res.ok || !responseData.success) {
            throw new Error(responseData.message || "Không thể đăng xuất thiết bị");
        }
        return responseData.data;
    },

    async revokeAllSessions() {
        const res = await AuthService.fetchWithAuth(`${API_URL}/user/sessions`, {
            method: "DELETE",
        });
        const responseData = await res.json();
        if (!res.ok || !responseData.success) {
            throw new Error(responseData.message || "Không thể đăng xuất tất cả thiết bị");
        }
        return responseData.data;
    },

    async deleteUser(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/user/delete/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = responseData.data;
            return await data;
        } catch (err) {
            console.error("Error deleting user:", err);
            throw err;
        }
    }
};