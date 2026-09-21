const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";
let hasShownAlert = false;

const getCurrentLanguageQuery = () => {
    const language = localStorage.getItem("language") || "vi";
    return language === "en" ? "&lang=en" : "";
};

function paginatedResponse(responseData, page) {
    const items = Array.isArray(responseData?.data) ? responseData.data : responseData?.data?.data || [];
    const meta = responseData?.meta || responseData?.data || responseData || {};
    return {
        data: items,
        currentPage: meta.currentPage || page,
        totalPages: meta.totalPages || 1,
    };
}

export const GrammarExerciseService = {
    async fetchGrammarExercise(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            if (!filters.admin) query += getCurrentLanguageQuery();
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/grammar-exercises${query}`, {
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
            const langQuery = getCurrentLanguageQuery().replace("&", "?");
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/grammar-exercises/slug/${slug}${langQuery}`);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = responseData.data?.grammarExercise || responseData.data || responseData;
            return data;
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    async getGrammarExerciseDetail(id) {
        const langQuery = getCurrentLanguageQuery().replace("&", "?");
        const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/grammar-exercises/${id}${langQuery}`, {
            method: "GET",
        });
        if (!res.ok) {
            const err = new Error(`HTTP error! Status: ${res.status}`);
            err.status = res.status;
            throw err;
        }
        const responseData = await res.json();
        const data = responseData.data || responseData;
        return data;
    },

    async fetchGrammarExerciseRoadmap() {
        try {
            const langQuery = getCurrentLanguageQuery().replace("&", "?");
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/grammar-exercises/roadmap${langQuery}`, {
                method: "GET",
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            hasShownAlert = false;
            return responseData.data || { items: [], progress: { unlockedCount: 0, totalCount: 0, percent: 0 } };
        } catch (error) {
            console.error("Error fetching grammar exercise roadmap:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
            return { items: [], progress: { unlockedCount: 0, totalCount: 0, percent: 0 } };
        }
    },

    async startGrammarExerciseAttempt(grammarExerciseId) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/grammar-exercises/${grammarExerciseId}/attempts`, {
            method: "POST",
        });
        if (!res.ok) {
            const err = new Error(`HTTP error! Status: ${res.status}`);
            err.status = res.status;
            throw err;
        }
        const responseData = await res.json();
        return responseData.data;
    },

    async checkGrammarExerciseQuestion(attemptId, questionIndex, answer) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/attempts/${attemptId}/questions/${questionIndex}/check`, {
            method: "POST",
            body: JSON.stringify({ answer }),
        });
        if (!res.ok) {
            const responseData = await res.json().catch(() => ({}));
            const err = new Error(responseData.message || `HTTP error! Status: ${res.status}`);
            err.status = res.status;
            throw err;
        }
        const responseData = await res.json();
        return responseData.data;
    },

    async finishGrammarExerciseAttempt(attemptId) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/attempts/${attemptId}/finish`, {
            method: "POST",
        });
        if (!res.ok) {
            const responseData = await res.json().catch(() => ({}));
            const err = new Error(responseData.message || `HTTP error! Status: ${res.status}`);
            err.status = res.status;
            throw err;
        }
        const responseData = await res.json();
        return responseData.data;
    },

    async fetchGrammarExerciseAttemptHistory(page = 1, limit = 10) {
        const query = new URLSearchParams({ page: page.toString(), limit: limit.toString() }).toString();
        const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/attempts/history?${query}`, {
            method: "GET",
        });
        if (!res.ok) {
            const responseData = await res.json().catch(() => ({}));
            const err = new Error(responseData.message || `HTTP error! Status: ${res.status}`);
            err.status = res.status;
            throw err;
        }
        const responseData = await res.json();
        return responseData.data || { items: [], currentPage: page, totalPages: 1, totalItems: 0 };
    },

    async getGrammarExerciseAttemptDetail(attemptId) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/attempts/${attemptId}`, {
            method: "GET",
        });
        if (!res.ok) {
            const responseData = await res.json().catch(() => ({}));
            const err = new Error(responseData.message || `HTTP error! Status: ${res.status}`);
            err.status = res.status;
            throw err;
        }
        const responseData = await res.json();
        return responseData.data;
    },

    async deleteGrammarExerciseAttemptHistory(attemptId) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/attempts/${attemptId}`, {
            method: "DELETE",
        });
        if (!res.ok) {
            const responseData = await res.json().catch(() => ({}));
            const err = new Error(responseData.message || `HTTP error! Status: ${res.status}`);
            err.status = res.status;
            throw err;
        }
        const responseData = await res.json();
        return responseData.data || responseData;
    },

    async getGrammarExerciseAdmin(id) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/${id}`, {
            method: "GET",
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const responseData = await res.json();
        return responseData.data || responseData;
    },

    async completeGrammarExercise(grammarexerciseId) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/grammar-exercise/api/grammar-exercises/complete/${grammarexerciseId}`, {
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
            const responseData = await res.json();
            const data = responseData.data;
            return data;
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
            const responseData = await res.json();
            const data = responseData.data;
            return data;
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
            const responseData = await res.json();
            const data = responseData.data;
            return data;
        } catch (err) {
            console.error("Error deleting grammar:", err);
            throw err;
        }
    }
};
