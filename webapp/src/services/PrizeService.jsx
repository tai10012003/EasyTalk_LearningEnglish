const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
let hasShownAlert = false;

export const PrizeService = {
    async getAllPrizes() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/prize/api/prizes`, {
                method: "GET",
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            return data.prizes || [];
        } catch (err) {
            console.error("Error fetching prizes:", err);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "warning",
                    title: "Tạm thời không tải được giải thưởng",
                    text: "Dữ liệu sẽ được hiển thị khi có kết nối.",
                    timer: 3000,
                    showConfirmButton: false
                });
            }
            return [];
        }
    },

    async fetchPrizes(page = 1, limit = 12) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            const res = await AuthService.fetchWithAuth(`${API_URL}/prize/api/prize-list${query}`, {
                method: 'GET',
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            console.log('Fetch success:', data);
            return data;
        } catch (error) {
            console.error("Error fetching prizes:", error.message);
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

    async checkAndUnlockPrizes() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/prize/check-prize`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Check prize failed");
            const data = await res.json();
            if (data.newPrizes?.length > 0) {
                const names = data.newPrizes.map(p => p.name).join(", ");
                Swal.fire({
                    icon: "success",
                    title: "Chúc mừng!",
                    text: `Bạn đã mở khóa: ${names}`,
                });
            }
            return data;
        } catch (err) {
            console.error("Error checking prizes:", err);
            return { success: false, newPrizes: [], totalUnlocked: 0 };
        }
    },

    async addPrize(formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/prize/add`, {
                method: "POST",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error adding prize:", err);
            throw err;
        }
    },

    async updatePrize(id, formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/prize/update/${id}`, {
                method: "PUT",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error updating prize:", err);
            throw err;
        }
    },

    async deletePrize(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/prize/delete/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting prize:", err);
            throw err;
        }
    }
};