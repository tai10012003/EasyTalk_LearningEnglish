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

    async fetchGate(page = 1, limit = 12) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/gate/api/gate-list?page=${page}&limit=${limit}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error fetching gate:", err);
            return {
                gates: [],
                currentPage: 1,
                totalPages: 1
            };
        }
    },

    async addGate(formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/gate/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error adding gate:", err);
            throw err;
        }
    },

    async updateGate(id, formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/gate/update/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error updating gate:", err);
            throw err;
        }
    },

    async deleteGate(id) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/gate/delete/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting gate:", err);
            throw err;
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    }
};