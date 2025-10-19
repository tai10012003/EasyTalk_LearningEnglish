const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';

export const UserProgressService = {
    async getUserStreak() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/userprogress/api/userprogress/streak`, {
                method: "GET",
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
            const res = await AuthService.fetchWithAuth(`${API_URL}/userprogress/api/userprogress/experiencepoint`, {
                method: "GET",
            });
            if (!res.ok) throw new Error("Failed to fetch experience points data");
            return await res.json();
        } catch (err) {
            console.error("Error fetching experience points data:", err);
            throw err;
        }
    }
};