const API_URL = import.meta.env.VITE_API_URL;

let hasShownAlert = false;
export const StoryService = {
  async fetchStories(page = 1, limit = 6, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.category) query += `&category=${encodeURIComponent(filters.category)}`;
            if (filters.level) query += `&level=${encodeURIComponent(filters.level)}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/story/api/story-list${query}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
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
            console.error("Error fetching stories:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                window.alert("Không thể kết nối đến server. Vui lòng kiểm tra xem server (http://localhost:3000) đã được bật chưa hoặc có lỗi kết nối. Hệ thống sẽ hiển thị dữ liệu mặc định.");
            }
            return { data: [], currentPage: 1, totalPages: 1 };
        }
    },

    async getStoryById(id) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/story/api/story/${id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`,
                },
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
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/story/api/story/${id}`, {
                method: "GET",
                headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token || ""}`,
                },
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
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/story/api/story/complete/${storyId}`, {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token || ""}`,
                },
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
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/story/api/story/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting story:", err);
            throw err;
        }
    }
};