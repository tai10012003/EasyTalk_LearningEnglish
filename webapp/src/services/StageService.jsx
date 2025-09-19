const API_URL = "http://localhost:3000";

let hasShownAlert = false;

export const StageService = {
    async getStage(stageId) {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Không tìm thấy token trong localStorage");
            }

            const res = await fetch(`${API_URL}/stage/api/stage/detail/${stageId}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const data = await res.json();
            hasShownAlert = false;
            console.log("Fetch stage detail success:", data);
            return data;
        } catch (error) {
            console.error("Error fetching stage detail:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                window.alert(
                    "Không thể kết nối đến server. Vui lòng kiểm tra server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                );
            }
            return {
                stage: {
                    _id: stageId,
                    title: "Stage mặc định",
                    questions: [],
                    gate: { title: "Gate mặc định" },
                },
                userProgress: {
                    experiencePoints: 0,
                },
            };
        }
    },

    async completeStage(stageId) {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Không tìm thấy token trong localStorage");
            }
            const res = await fetch(`${API_URL}/stage/api/stage/complete/${stageId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            console.log("Complete stage success:", data);
            return data;
        } catch (error) {
            console.error("Error completing stage:", error.message);
            return { success: false, message: "Không thể hoàn thành stage." };
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    }
};