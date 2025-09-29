const API_URL = import.meta.env.VITE_API_URL;
let hasShownAlert = false;

export const ChatAIService = {
    async sendMessage(message, topic = null, step = null) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/chat/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`,
                },
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
                window.alert("Không thể kết nối đến server. Vui lòng kiểm tra server backend đã bật chưa.");
            }
            throw error;
        }
    },

    async startConversation() {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/chat/api/chat/start`, {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        if (!res.ok) throw new Error("Failed to start conversation");
        return await res.json();
    },

    resetAlertFlag() {
        hasShownAlert = false;
    }
};
