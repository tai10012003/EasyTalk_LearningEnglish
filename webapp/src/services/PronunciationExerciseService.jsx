const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";
let hasShownAlert = false;

export const PronunciationExerciseService = {
    async fetchPronunciationExercise(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            const res = await AuthService.fetchWithAuth(`${API_URL}/pronunciation-exercise/api/pronunciation-exercises${query}`, {
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
            console.error("Error fetching pronunciation exercise:", error.message);
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

    async getPronunciationExerciseBySlug(slug) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/pronunciation-exercise/api/pronunciation-exercises/slug/${slug}`);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            return data;
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    async analyzePronunciation(exerciseId, questionIndex, audioBlob) {
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.wav');

            const res = await fetch(`${API_URL}/pronunciation-exercise/analyze/${exerciseId}/${questionIndex}`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            return data;
        } catch (err) {
            console.error("Error analyzing audio:", err);
            return { success: false, message: "Lỗi khi phân tích giọng nói." };
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    },

    async addPronunciationExercise(formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/pronunciation-exercise/add`, {
                method: "POST",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error adding pronunciation:", err);
            throw err;
        }
    },

    async updatePronunciationExercise(id, formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/pronunciation-exercise/update/${id}`, {
                method: "PUT",
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error updating pronunciation:", err);
            throw err;
        }
    },

    async deletePronunciationExercise(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/pronunciation-exercise/delete/${id}`, {
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