import Swal from "sweetalert2";
import { AuthService } from '@/services/AuthService.jsx';
const API_URL = import.meta.env.VITE_API_URL;
let hasShownAlert = false;

export const DashboardService = {
    async fetchUserActivityLast7Days() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/dashboard/user-activity`, {
                method: 'GET'
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const result = await res.json();
            if (!result.success) {
                throw new Error(result.message || "Lỗi dữ liệu từ server");
            }
            hasShownAlert = false;
            return result.data;
        } catch (error) {
            console.error("Error fetching user activity:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi kết nối",
                    text: "Không thể lấy dữ liệu hoạt động người dùng. Hiển thị dữ liệu mẫu.",
                    timer: 3000
                });
            }
            return {
                labels: ["23/12/2025", "24/12/2025", "25/12/2025", "26/12/2025", "27/12/2025", "28/12/2025", "29/12/2025"],
                data: [12, 19, 15, 25, 22, 30, 28]
            };
        }
    },

    async fetchDashboardOverview() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/dashboard/overview`, {
                method: 'GET'
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const result = await res.json();
            if (!result.success) {
                throw new Error(result.message || "Lỗi dữ liệu từ server");
            }
            return result.data;
        } catch (error) {
            console.error("Error fetching dashboard overview:", error.message);
            return {
                totalJourneys: 12,
                totalLessons: 45,
                totalExercises: 68,
                totalUsers: 156,
                newUsersThisMonth: 18,
                activeUsersThisWeek: 8,
                activeUsersToday: 5
            };
        }
    },

    async fetchLessonBreakdown() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/dashboard/lesson-breakdown`, {
                method: 'GET'
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const result = await res.json();
            if (!result.success) {
                throw new Error(result.message || "Lỗi dữ liệu từ server");
            }
            return result.data;
        } catch (error) {
            console.error("Error fetching lesson breakdown:", error.message);
            return [
                { name: "Ngữ Pháp", y: 25 },
                { name: "Phát Âm", y: 15 },
                { name: "Câu Chuyện", y: 5 }
            ];
        }
    },

    async fetchExerciseBreakdown() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/dashboard/exercise-breakdown`, {
                method: 'GET',
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const result = await res.json();
            if (!result.success) {
                throw new Error(result.message || "Lỗi dữ liệu từ server");
            }
            return result.data;
        } catch (error) {
            console.error("Error fetching exercise breakdown:", error.message);
            return [
                { name: "Ngữ Pháp", y: 28 },
                { name: "Phát Âm", y: 18 },
                { name: "Từ Vựng", y: 12 },
                { name: "Nghe Chép", y: 10 }
            ];
        }
    },

    async fetchRecentActivities(limit = 10) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/dashboard/recent-activities?limit=${limit}`, {
                method: 'GET',
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const result = await res.json();
            if (!result.success) {
                throw new Error(result.message || "Lỗi dữ liệu từ server");
            }
            return result.data;
        } catch (error) {
            console.error("Error fetching recent activities:", error.message);
            return [
                { id: 1, user: "Nguyễn Văn A", action: "Đăng ký tài khoản mới", time: "5 phút trước", icon: "fas fa-user-plus", color: "text-info" },
                { id: 2, user: "Trần Thị B", action: "Đăng ký tài khoản mới", time: "15 phút trước", icon: "fas fa-user-plus", color: "text-info" },
                { id: 3, user: "Lê Văn C", action: "Đăng ký tài khoản mới", time: "1 giờ trước", icon: "fas fa-user-plus", color: "text-info" }
            ];
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    }
};