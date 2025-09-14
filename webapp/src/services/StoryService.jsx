const API_URL = "http://localhost:3000";

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
            const res = await fetch(`${API_URL}/api/story/${id}`, {
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
    }
};