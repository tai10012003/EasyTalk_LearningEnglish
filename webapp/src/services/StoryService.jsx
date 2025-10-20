const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";

let hasShownAlert = false;
export const StoryService = {
  async fetchStories(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.category) query += `&category=${encodeURIComponent(filters.category)}`;
            if (filters.level) query += `&level=${encodeURIComponent(filters.level)}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            const res = await AuthService.fetchWithAuth(`${API_URL}/story/api/story-list${query}`, {
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
            console.error("Error fetching stories:", error.message);
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

    async getStoryById(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/story/api/story/${id}`, {
                method: "GET",
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            console.log("Fetch story detail success:", data);
            return data.data;
        } catch (error) {
            console.error("Error fetching story detail:", error.message);
            return null;
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    },

    async getStoryDetail(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/story/api/story/${id}`, {
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

    async completeStory(storyId) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/story/api/story/complete/${storyId}`, {
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

    async addStory(formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/story/api/add`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error adding story:", err);
            throw err;
        }
    },

    async updateStory(id, formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/story/api/update/${id}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error updating story:", err);
            throw err;
        }
    },

    async deleteStory(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/story/api/story/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting story:", err);
            throw err;
        }
    }
};