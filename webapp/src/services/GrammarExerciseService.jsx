const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";
let hasShownAlert = false;

export const GrammarExerciseService = {
    async fetchGrammarExercise(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/grammar-exercises${query}`, {
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
            console.error("Error fetching grammar exercise:", error.message);
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

    async getGrammarExerciseBySlug(slug) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/grammar-exercises/slug/${slug}`);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            return data;
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    async getGrammarExerciseDetail(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/grammar-exercises/${id}`, {
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

    async completeGrammarExercise(grammarexerciseId) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/grammar-exercises/complete/${grammarexerciseId}`, {
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

    resetAlertFlag() {
        hasShownAlert = false;
    },

    async addGrammarExercise(formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/add`, {
                method: "POST",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error adding grammar:", err);
            throw err;
        }
    },

    async updateGrammarExercise(id, formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/update/${id}`, {
                method: "PUT",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error updating grammar:", err);
            throw err;
        }
    },

    async deleteGrammarExercise(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/delete/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting grammar:", err);
            throw err;
        }
    }
};