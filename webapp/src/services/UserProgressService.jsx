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
    }
};