const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
let hasShownAlert = false;

export const GateService = {
    async getGate(gateId) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/journey/api/gate/${gateId}`, {
                method: 'GET',
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            console.log("Fetch gate detail success:", data);
            return data;
        } catch (error) {
            console.error("Error fetching gate detail:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                window.alert(
                    "Không thể kết nối đến server. Vui lòng kiểm tra xem server đã bật chưa. Hệ thống sẽ hiển thị dữ liệu mặc định."
                );
            }
            return {
                gate: {
                    _id: gateId,
                    title: "Gate mặc định",
                    stages: []
                },
                userProgress: {
                    unlockedStages: [],
                },
            };
        }
    },

    async fetchGate(page = 1, limit = 12) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/gate/api/gate-list?page=${page}&limit=${limit}`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error fetching gate:", err);
            return {
                gates: [],
                currentPage: 1,
                totalPages: 1
            };
        }
    },

    async addGate(formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/gate/add`, {
                method: "POST",
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error adding gate:", err);
            throw err;
        }
    },

    async updateGate(id, formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/gate/update/${id}`, {
                method: "PUT",
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error updating gate:", err);
            throw err;
        }
    },

    async deleteGate(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/gate/delete/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting gate:", err);
            throw err;
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    }
};