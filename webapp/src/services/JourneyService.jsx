const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";
let hasShownAlert = false;

export const JourneyService = {
    async fetchJourney() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/journey/api`, {
                method: "GET",
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            console.log("Journey fetch success:", data);
            return data;
        } catch (error) {
            console.error("Error fetching journey:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
            return {
                journeys: [],
                userProgress: { experiencePoints: 0 },
                completedGates: 0,
                completedStages: 0,
                leaderboard: [],
            };
        }
    },

    async fetchJourneyAdmin(page = 1, limit = 12) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/journey/api/journey-list?page=${page}&limit=${limit}`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error fetching journey:", err);
            return {
                journeys: [],
                currentPage: 1,
                totalPages: 1
            };
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    },

    async addJourney(formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/journey/add`, {
                method: "POST",
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error adding journey:", err);
            throw err;
        }
    },

    async updateJourney(id, formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/journey/update/${id}`, {
                method: "PUT",
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error updating journey:", err);
            throw err;
        }
    },

    async deleteJourney(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/journey/delete/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting journey:", err);
            throw err;
        }
    }
};