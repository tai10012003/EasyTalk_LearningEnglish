const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
let hasShownAlert = false;

export const UserProgressService = {
    async getUserStreak() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/userprogress/streak`, {
                method: "GET",
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (err) {
            console.error("Error fetching streak data:", err);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
            throw err;
        }
    },

    async getUserExperiencePoints() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/userprogress/experiencepoint`, {
                method: "GET",
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (err) {
            console.error("Error fetching experience points data:", err);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
            throw err;
        }
    },

    async recordStudyTime(seconds) {
        if (seconds < 30) return;
        try {
            await AuthService.fetchWithAuth(`${API_URL}/userprogress/study-time`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ seconds }),
            });
        } catch (err) {
            console.error("Lỗi ghi thời gian học:", err);
        }
    },

    async getLeaderboard(type = 'exp', period = 'all', limit = 50) {
        try {
            const query = new URLSearchParams({ type, period, limit: limit.toString() }).toString();
            const res = await AuthService.fetchWithAuth(`${API_URL}/userprogress/leaderboard?${query}`, {
                method: "GET" 
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
            }
            const result = await res.json();
            hasShownAlert = false;
            return result.data || [];
        } catch (err) {
            console.error("Error fetching leaderboard:", err);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "warning",
                    title: "Tạm thời không tải được bảng xếp hạng",
                    text: "Dữ liệu sẽ được hiển thị khi có kết nối.",
                    timer: 3000,
                    showConfirmButton: false
                });
            }
            return [];
        }
    },

    async getCurrentUserProgress() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/userprogress/api/current`, {
                method: "GET"
            });
            if (!res.ok) throw new Error("Cannot fetch current user");
            return await res.json();
        } catch (err) {
            console.error("Error fetching current user progress:", err);
            return null;
        }
    },

    async fetchUserProgressList(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            const res = await AuthService.fetchWithAuth(`${API_URL}/userprogress/api/userprogress-list${query}`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            hasShownAlert = false;
            console.log("Fetch user progress success:", data);
            return data;
        } catch (error) {
            console.error("Error fetching user progress:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối. Dữ liệu mặc định sẽ được hiển thị.",
                });
            }
            return { data: [], currentPage: 1, totalPages: 1 };
        }
    },

    async getUserProgressDetail(userId) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/userprogress/api/userprogress/${userId}`, {
                method: "GET",
            });
            if (!res.ok) {
                const err = new Error(`HTTP error! Status: ${res.status}`);
                err.status = res.status;
                throw err;
            }
            return await res.json();
        } catch (error) {
            console.error("Error fetching user progress detail:", error);
            throw error;
        }
    },

    async deleteUserProgress(userId) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/userprogress/delete/${userId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting user progress:", err);
            throw err;
        }
    },
};