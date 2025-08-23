const API_URL = "http://localhost:3000";

export const StoryService = {
    async fetchStories(page = 1, limit = 2) {
        try {
        const res = await fetch(`${API_URL}/story/api/story-list?page=${page}&limit=${limit}`);
        const data = await res.json();
        return data;
        } catch (error) {
        console.error("Error fetching stories:", error);
        return { stories: [], currentPage: 1, totalPages: 1 };
        }
    }
};