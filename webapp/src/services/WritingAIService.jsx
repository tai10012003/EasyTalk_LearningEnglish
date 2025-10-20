const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";
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
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
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
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
            throw error;
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    },
};