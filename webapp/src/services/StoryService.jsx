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

function unwrapResponseData(responseData) {
    if (!responseData || typeof responseData !== "object") return responseData;
    if (responseData.meta && typeof responseData.data === "object" && responseData.data !== null && !Array.isArray(responseData.data)) {
        return { ...responseData.data, ...responseData.meta };
    }
    return responseData.data;
}

export const StoryService = {
    async fetchStories(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.category) query += `&category=${encodeURIComponent(filters.category)}`;
            if (filters.level) query += `&level=${encodeURIComponent(filters.level)}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            if (!filters.admin) query += getCurrentLanguageQuery();
            const res = await AuthService.fetchWithAuth(`${API_URL}/story/api/story-list${query}`, {
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

    async fetchStoryRoadmap() {
        const langQuery = getCurrentLanguageQuery().replace("&", "?");
        const res = await AuthService.fetchWithAuth(`${API_URL}/story/api/story/roadmap${langQuery}`, {
            method: "GET",
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

    async getStoryBySlug(slug) {
        try {
            const langQuery = getCurrentLanguageQuery().replace("&", "?");
            const res = await AuthService.fetchWithAuth(`${API_URL}/story/api/story/slug/${encodeURIComponent(slug)}${langQuery}`, {
                method: "GET",
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            const data = unwrapResponseData(responseData);
            console.log("Fetch story detail success:", data);
            return data?.story || data?.data || data;
        } catch (error) {
            console.error("Error fetching story detail:", error.message);
            return null;
        }
    },

    async getStory(id) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/story/api/${id}`, {
            method: "GET",
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const responseData = await res.json();
        return responseData.data;
    },

    resetAlertFlag() {
        hasShownAlert = false;
    },

    async getStoryDetail(id) {
        const langQuery = getCurrentLanguageQuery().replace("&", "?");
        const res = await AuthService.fetchWithAuth(`${API_URL}/story/api/story/${id}${langQuery}`, {
            method: "GET",
        });
        if (!res.ok) {
            const err = new Error(`HTTP error! Status: ${res.status}`);
            err.status = res.status;
            throw err;
        }
        const responseData = await res.json();
        const data = unwrapResponseData(responseData);
        return data?.story || data;
    },

    async completeStory(storyId) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/story/api/story/complete/${storyId}`, {
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

    async addStory(formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/story/api/add`, {
                method: "POST",
                body: formData,
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = responseData.data;
            return await data;
        } catch (err) {
            console.error("Error adding story:", err);
            throw err;
        }
    },

    async updateStory(id, formData) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/story/api/update/${id}`, {
                method: "PUT",
                body: formData,
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const responseData = await res.json();
            const data = responseData.data;
            return await data;
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
            const responseData = await res.json();
            const data = responseData.data;
            return await data;
        } catch (err) {
            console.error("Error deleting story:", err);
            throw err;
        }
    }
};
