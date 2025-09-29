const API_URL = import.meta.env.VITE_API_URL;

let hasShownAlert = false;

export const GateService = {
    async getGate(gateId) {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Không tìm thấy token trong localStorage");
            }
            const res = await fetch(`${API_URL}/journey/api/gate/${gateId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            console.log("Fetch gate detail success:", data);
            return data;
        } catch (error) {
            console.error("Error fetching gate detail:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                window.alert(
                    "Không thể kết nối đến server. Vui lòng kiểm tra xem server đã bật chưa. Hệ thống sẽ hiển thị dữ liệu mặc định."
                );
            }
            return {
                gate: {
                    _id: gateId,
                    title: "Gate mặc định",
                    stages: []
                },
                userProgress: {
                    unlockedStages: [],
                },
            };
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    }
};