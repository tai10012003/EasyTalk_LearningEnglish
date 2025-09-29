const API_URL = import.meta.env.VITE_API_URL;

export const UserProgressService = {
    async getUserStreak() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Không tìm thấy token trong localStorage");
            }
            const res = await fetch(`${API_URL}/userprogress/api/userprogress/streak`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) throw new Error("Failed to fetch streak data");
                return await res.json();
        } catch (err) {
            console.error("Error fetching streak data:", err);
            throw err;
        }
    },
    
    async getUserExperiencePoints() {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                throw new Error("Không tìm thấy token trong localStorage");
            }
            const res = await fetch(`${API_URL}/userprogress/api/userprogress/experiencepoint`, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) throw new Error("Failed to fetch experience points data");
            return await res.json();
        } catch (err) {
            console.error("Error fetching experience points data:", err);
            throw err;
        }
    }
};