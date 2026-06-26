const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";
let hasShownAlert = false;


function paginatedResponse(responseData, page) {
    const items = Array.isArray(responseData?.data) ? responseData.data : responseData?.data?.data || [];
    const meta = responseData?.meta || responseData?.data || responseData || {};
    return {
        data: items,
        currentPage: meta.currentPage || page,
        totalPages: meta.totalPages || 1,
    };
}

export const VocabularyExerciseService = {
    async fetchVocabularyExercise(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            const res = await AuthService.fetchWithAuth(`${API_URL}/vocabulary-exercise/api/vocabulary-exercises${query}`, {
                method: 'GET',
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            const data = paginatedResponse(responseData, page);
            hasShownAlert = false;
            console.log('Fetch success:', data);
            return data;
        } catch (error) {
            console.error("Error fetching vocabulary exercise:", error.message);
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

    async getVocabularyExerciseBySlug(slug) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/vocabulary-exercise/api/vocabulary-exercises/slug/${slug}`);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = responseData.data;
            return data;
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    async getVocabularyExerciseDetail(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/vocabulary-exercise/api/vocabulary-exercises/${id}`, {
                method: "GET",
            });
            if (!res.ok) {
                const err = new Error(`HTTP error! Status: ${res.status}`);
                err.status = res.status;
                throw err;
            }
            const responseData = await res.json();
            const data = responseData.data;
            return data;
        } catch (error) {
            throw error;
        }
    },

    async completeVocabularyExercise(vocabularyexerciseId) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/vocabulary-exercise/api/vocabulary-exercises/complete/${vocabularyexerciseId}`, {
                method: "POST",
            });
            if (!res.ok) {
                const err = new Error(`HTTP error! Status: ${res.status}`);
                err.status = res.status;
                throw err;
            }
            const responseData = await res.json();
            const data = responseData.data;
            return data;
        } catch (error) {
            throw error;
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    },

    async addVocabularyExercise(formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/vocabulary-exercise/add`, {
                method: "POST",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = responseData.data;
            return await data;
        } catch (err) {
            console.error("Error adding vocabulary:", err);
            throw err;
        }
    },

    async updateVocabularyExercise(id, formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/vocabulary-exercise/update/${id}`, {
                method: "PUT",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = responseData.data;
            return await data;
        } catch (err) {
            console.error("Error updating vocabulary:", err);
            throw err;
        }
    },

    async deleteVocabularyExercise(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/vocabulary-exercise/delete/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = responseData.data;
            return await data;
        } catch (err) {
            console.error("Error deleting vocabulary:", err);
            throw err;
        }
    }
};