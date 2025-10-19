const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
let hasShownAlert = false;

export const WritingAIService = {
    async getRandomTopic() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/writing/api/writing/random-topic`, {
                method: "GET",
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            return data.topic;
        } catch (error) {
            console.error("Error fetching random topic:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                window.alert("Không thể kết nối đến server. Vui lòng kiểm tra server backend.");
            }
            throw error;
        }
    },

    async analyzeWriting(userText) {
        try {
            if (!userText || userText.trim() == "") {
                throw new Error("Vui lòng nhập bài viết của bạn.");
            }
            const res = await AuthService.fetchWithAuth(`${API_URL}/writing/api/analyze`, {
                method: "POST",
                body: JSON.stringify({ text: userText }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (error) {
            console.error("Error analyzing writing:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                window.alert("Không thể kết nối đến server. Vui lòng kiểm tra server backend.");
            }
            throw error;
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    },
};