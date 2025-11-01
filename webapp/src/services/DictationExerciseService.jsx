const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";
let hasShownAlert = false;

export const DictationExerciseService = {
    async fetchDictationExercise(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/api/dictation-exercises${query}`, {
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
            console.error("Error fetching dictation exercise:", error.message);
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

    async getDictationExerciseById(id) {
        try {
            const res = await fetch(`${API_URL}/dictation-exercise/api/dictationexercise/${id}`);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            return data;
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    async getDictationExerciseBySlug(slug) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/api/dictationexercise/slug/${encodeURIComponent(slug)}`);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            return data;
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    async getDictationExerciseDetail(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/api/dictationexercise/${id}`, {
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

    async completeDictationExercise(dictationexerciseId) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/api/dictation-exercises/complete/${dictationexerciseId}`, {
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

    async addDictationExercise(formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/add`, {
                method: "POST",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error adding dictation:", err);
            throw err;
        }
    },

    async updateDictationExercise(id, formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/update/${id}`, {
                method: "PUT",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error updating dictation:", err);
            throw err;
        }
    },

    async deleteDictationExercise(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/delete/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting dictation:", err);
            throw err;
        }
    }
};