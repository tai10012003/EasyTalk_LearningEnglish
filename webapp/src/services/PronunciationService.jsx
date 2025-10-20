const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";

let hasShownAlert = false;
export const PronunciationService = {
    async fetchPronunciations(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            const res = await AuthService.fetchWithAuth(`${API_URL}/pronunciation/api/pronunciation-list${query}`, {
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
            console.error("Error fetching pronunciation:", error.message);
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

    async getPronunciationById(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/pronunciation/api/pronunciation/${id}`, {
                method: "GET",
            });
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

    async getPronunciationDetail(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/pronunciation/api/pronunciation/${id}`, {
                method: "GET",
            });
            if (!res.ok) {
                const err = new Error(`HTTP error! Status: ${res.status}`);
                err.status = res.status;
                throw err;
            }
            const data = await res.json();
            return data;
        } catch (error) {
            throw error;
        }
    },

    async completePronunciation(pronunciationId) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/pronunciation/api/pronunciation/complete/${pronunciationId}`, {
                method: "POST",
            });
            if (!res.ok) {
                const err = new Error(`HTTP error! Status: ${res.status}`);
                err.status = res.status;
                throw err;
            }

            const data = await res.json();
            return data;
        } catch (error) {
            throw error;
        }
    },

    async addPronunciation(formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/pronunciation/api/add`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error adding pronunciation:", err);
            throw err;
        }
    },

    async updatePronunciation(id, formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/pronunciation/api/update/${id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error updating pronunciation:", err);
            throw err;
        }
    },

    async deletePronunciation(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/pronunciation/api/pronunciation/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting pronunciation:", err);
            throw err;
        }
    }
};