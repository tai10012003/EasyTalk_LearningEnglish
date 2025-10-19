const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';

let hasShownAlert = false;
export const UserService = {
    async fetchUser(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.role) query += `&role=${encodeURIComponent(filters.role)}`;
            const res = await fetch(`${API_URL}/user/api/user-list${query}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            console.log('Fetch success:', data);
            return data;
        } catch (error) {
            console.error("Error fetching user:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                window.alert("Không thể kết nối đến server. Vui lòng kiểm tra xem server (http://localhost:3000) đã được bật chưa hoặc có lỗi kết nối. Hệ thống sẽ hiển thị dữ liệu mặc định.");
            }
            return { data: [], currentPage: 1, totalPages: 1 };
        }
    },

    async getUserById(id) {
        try {
            const res = await fetch(`${API_URL}/user/api/${id}`);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
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
            return await res.json();
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
            return await res.json();
        } catch (err) {
            console.error("Error updating user:", err);
            throw err;
        }
    },

    async deleteUser(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/user/delete/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting user:", err);
            throw err;
        }
    }
};