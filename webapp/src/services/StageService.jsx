const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";
let hasShownAlert = false;

export const StageService = {
    async getStage(stageId) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/stage/api/stage/detail/${stageId}`, {
                method: "GET",
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            console.log("Fetch stage detail success:", data);
            return data;
        } catch (error) {
            console.error("Error fetching stage detail:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
            return {
                stage: {
                    _id: stageId,
                    title: "Stage mặc định",
                    questions: [],
                    gate: { title: "Gate mặc định" },
                },
                userProgress: {
                    experiencePoints: 0,
                },
            };
        }
    },

    async completeStage(stageId) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/stage/api/stage/complete/${stageId}`, {
                method: "POST",
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            console.log("Complete stage success:", data);
            return data;
        } catch (error) {
            console.error("Error completing stage:", error.message);
            return { success: false, message: "Không thể hoàn thành stage." };
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    },

    async fetchStage(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            const res = await fetch(`${API_URL}/stage/api/stages${query}`, {
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
            console.error("Error fetching stage :", error.message);
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

    async addStage(formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/stage/add`, {
                method: "POST",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error adding stage:", err);
            throw err;
        }
    },

    async updateStage(id, formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/stage/update/${id}`, {
                method: "PUT",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error updating stage:", err);
            throw err;
        }
    },

    async deleteStage(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/stage/delete/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting stage:", err);
            throw err;
        }
    }
};