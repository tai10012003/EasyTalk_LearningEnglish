const API_URL = import.meta.env.VITE_API_URL;

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
    },

    async fetchStage(page = 1, limit = 12, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            const res = await fetch(`${API_URL}/stage/api/stages${query}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
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
            console.error("Error fetching stage :", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                window.alert("Không thể kết nối đến server. Vui lòng kiểm tra xem server (http://localhost:3000) đã được bật chưa hoặc có lỗi kết nối. Hệ thống sẽ hiển thị dữ liệu mặc định.");
            }
            return { data: [], currentPage: 1, totalPages: 1 };
        }
    },

    async addStage(formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/stage/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error adding stage:", err);
            throw err;
        }
    },

    async updateStage(id, formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/stage/update/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error updating stage:", err);
            throw err;
        }
    },

    async deleteStage(id) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/stage/delete/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting stage:", err);
            throw err;
        }
    }
};