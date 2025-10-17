const API_URL = import.meta.env.VITE_API_URL;

let hasShownAlert = false;

export const JourneyService = {
    async fetchJourney() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Không tìm thấy token trong localStorage");
            }
            const res = await fetch(`${API_URL}/journey/api`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const data = await res.json();
            hasShownAlert = false;
            console.log("Journey fetch success:", data);
            return data;
        } catch (error) {
            console.error("Error fetching journey:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                window.alert(
                    "Không thể kết nối đến server. Vui lòng kiểm tra xem server (http://localhost:3000) đã được bật chưa hoặc có lỗi kết nối."
                );
            }
            return {
                journeys: [],
                userProgress: { experiencePoints: 0 },
                completedGates: 0,
                completedStages: 0,
                leaderboard: [],
            };
        }
    },

    async fetchJourneyAdmin(page = 1, limit = 12) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/journey/api/journey-list?page=${page}&limit=${limit}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error fetching journey:", err);
            return {
                journeys: [],
                currentPage: 1,
                totalPages: 1
            };
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    },

    async addJourney(formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/journey/add`, {
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
            console.error("Error adding journey:", err);
            throw err;
        }
    },

    async updateJourney(id, formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/journey/update/${id}`, {
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
            console.error("Error updating journey:", err);
            throw err;
        }
    },

    async deleteJourney(id) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/journey/delete/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting journey:", err);
            throw err;
        }
    }
};