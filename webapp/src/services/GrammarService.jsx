import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";
const API_URL = import.meta.env.VITE_API_URL;

let hasShownAlert = false;
export const GrammarService = {
    async fetchGrammars(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar/api/grammar-list${query}`, {
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
            console.error("Error fetching grammar:", error.message);
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

    async getGrammarBySlug(slug) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar/api/grammar/slug/${encodeURIComponent(slug)}`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            return data;
        } catch (err) {
            console.error("Error fetching grammar by slug:", err);
            return null;
        }
    },

    async getGrammarDetail(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar/api/grammar/${id}`, {
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

    async completeGrammar(grammarId) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar/api/grammar/complete/${grammarId}`, {
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

    async addGrammar(formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/grammar/api/add`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error adding grammar:", err);
            throw err;
        }
    },

    async updateGrammar(id, formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/grammar/api/update/${id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error updating grammar:", err);
            throw err;
        }
    },

    async deleteGrammar(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/grammar/api/grammar/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting grammar:", err);
            throw err;
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    }
};