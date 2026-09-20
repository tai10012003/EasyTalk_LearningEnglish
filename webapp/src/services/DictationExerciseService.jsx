const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";
let hasShownAlert = false;

const getCurrentLanguageQuery = () => {
    const language = localStorage.getItem("language") || "vi";
    return language === "en" ? "&lang=en" : "";
};

function unwrapResponseData(responseData) {
    if (!responseData || typeof responseData !== "object") return responseData;
    if (Array.isArray(responseData.dictationExercises)) {
        return {
            data: responseData.dictationExercises,
            currentPage: responseData.currentPage || 1,
            totalPages: responseData.totalPages || 1,
        };
    }
    if (responseData.meta && typeof responseData.data === "object" && responseData.data !== null && !Array.isArray(responseData.data)) {
        return { ...responseData.data, ...responseData.meta };
    }
    return responseData.data || responseData;
}

export const DictationExerciseService = {
    async fetchDictationExercise(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            if (!filters.admin) query += getCurrentLanguageQuery();
            const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/api/dictation-exercises${query}`, {
                method: 'GET',
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            const data = unwrapResponseData(responseData);
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
            const langQuery = getCurrentLanguageQuery().replace("&", "?");
            const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/api/dictationexercise/${id}${langQuery}`);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = unwrapResponseData(responseData);
            return data;
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    async getDictationExerciseBySlug(slug) {
        try {
            const langQuery = getCurrentLanguageQuery().replace("&", "?");
            const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/api/dictationexercise/slug/${encodeURIComponent(slug)}${langQuery}`);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = responseData.data?.dictationExercise || unwrapResponseData(responseData);
            return data;
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    async fetchDictationExerciseRoadmap() {
        const langQuery = getCurrentLanguageQuery().replace("&", "?");
        const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/api/dictation-exercises/roadmap${langQuery}`, {
            method: "GET",
        });
        if (!res.ok) {
            const err = new Error(`HTTP error! Status: ${res.status}`);
            err.status = res.status;
            throw err;
        }
        const responseData = await res.json();
        return responseData.data || responseData;
    },

    async getDictationExerciseDetail(id) {
        const langQuery = getCurrentLanguageQuery().replace("&", "?");
        const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/api/dictationexercise/${id}${langQuery}`, {
            method: "GET",
        });
        if (!res.ok) {
            const err = new Error(`HTTP error! Status: ${res.status}`);
            err.status = res.status;
            throw err;
        }
        const responseData = await res.json();
        const data = responseData.data?.dictationExercise || unwrapResponseData(responseData);
        return data;
    },

    async completeDictationExercise(dictationexerciseId) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/api/dictation-exercises/complete/${dictationexerciseId}`, {
            method: "POST",
        });
        if (!res.ok) {
            const err = new Error(`HTTP error! Status: ${res.status}`);
            err.status = res.status;
            throw err;
        }
        const responseData = await res.json();
        const data = unwrapResponseData(responseData);
        return data;
    },

    async getDictationExerciseAdmin(id) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/dictation-exercise/api/${id}`, {
            method: "GET",
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const responseData = await res.json();
        return responseData.data || responseData;
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
