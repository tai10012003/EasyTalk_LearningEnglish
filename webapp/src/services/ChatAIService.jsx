const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";
let hasShownAlert = false;

export const ChatAIService = {
    async sendMessage(message, topic = null, step = null) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/chat/api/chat`, {
                method: "POST",
                body: JSON.stringify({ message, sessionTopic: topic, step }),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            console.log("ChatAI response:", data);
            return data;
        } catch (error) {
            console.error("Error sending message:", error.message);
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

    async startConversation() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/chat/api/chat/start`, {
                method: "GET",
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            console.log("ChatAI startConversation:", data);
            return data;
        } catch (error) {
            console.error("Error starting conversation:", error.message);
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
    }
};
