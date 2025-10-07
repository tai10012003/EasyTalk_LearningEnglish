const API_URL = import.meta.env.VITE_API_URL;

let hasShownAlert = false;
export const DictationExerciseService = {
    async fetchDictationExercise(page = 1, limit = 6, filters = {}) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
            const res = await fetch(`${API_URL}/dictation-exercise/api/dictation-exercises${query}`, {
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
            console.error("Error fetching dictation exercise:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                window.alert("Không thể kết nối đến server. Vui lòng kiểm tra xem server (http://localhost:3000) đã được bật chưa hoặc có lỗi kết nối. Hệ thống sẽ hiển thị dữ liệu mặc định.");
            }
            return { data: [], currentPage: 1, totalPages: 1 };
        }
    },

    async getDictationExerciseById(id) {
        try {
            const res = await fetch(`${API_URL}/dictation-exercise/api/dictationexercise/${id}`);
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            return data;
        } catch (err) {
            console.error(err);
            return null;
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    },

    async addDictationExercise(formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/admin/dictation-exercise/add`, {
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
            console.error("Error adding dictation:", err);
            throw err;
        }
    },

    async updateDictationExercise(id, formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/admin/dictation-exercise/update/${id}`, {
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
            console.error("Error updating dictation:", err);
            throw err;
        }
    },

    async deleteDictationExercise(id) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/admin/dictation-exercise/delete/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return await res.json();
        } catch (err) {
            console.error("Error deleting dictation:", err);
            throw err;
        }
    }
};