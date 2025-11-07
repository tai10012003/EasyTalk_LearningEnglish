const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";
let hasShownAlert = false;

export const FlashCardService = {
    async fetchFlashcardLists(page = 1, limit = 12, tab = "mine") {
        try {
            let query = `?page=${page}&limit=${limit}&tab=${tab}`;
            const res = await AuthService.fetchWithAuth(`${API_URL}/flashcards/api/flashcard-list${query}`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (error) {
            console.error("Error fetching flashcard list:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
            return { flashcardLists: [], currentPage: 1, totalPages: 1 };
        }
    },

    async fetchDailyReviews() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/userprogress/dailyreviews`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            return data;
        } catch (error) {
            console.error("Error fetching daily reviews:", error.message);
            return { dailyFlashcardReviews: {} };
        }
    },

    async createFlashcardList(name, description) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/flashcards/create`, {
                method: "POST",
                body: JSON.stringify({ name, description }),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (error) {
            console.error("Error creating flashcard list:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
        }
    },

    async updateFlashcardList(id, name, description) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/flashcards/flashcardlist/${id}`, {
                method: "PUT",
                body: JSON.stringify({ name, description }),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (error) {
            console.error("Error updating flashcard list:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
        }
    },

    async deleteFlashcardList(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/flashcards/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (error) {
            console.error("Error deleting flashcard list:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
        }
    },

    async fetchFlashcards(listId, page = 1, limit = 12) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/flashcards/api/flashcardlist/${listId}?page=${page}&limit=${limit}`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (error) {
            console.error("Error fetching flashcards:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
        }
    },

    async createFlashcard(listId, formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/flashcards/flashcardlist/${listId}`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (error) {
            console.error("Error creating flashcards:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
        }
    },

    async updateFlashcard(id, formData) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/flashcards/update-flashcard/${id}`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (error) {
            console.error("Error updating flashcards:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
        }
    },

    async updateDifficulty(id, difficulty) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/flashcards/update-difficulty/${id}`, {
                method: "PUT",
                body: JSON.stringify({ difficulty }),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            return data;
        } catch (error) {
            console.error("Error updating difficulty:", error.message);
            throw error;
        }
    },

    async fetchDailyGoal() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/userprogress/daily-goal`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            return data;
        } catch (error) {
            console.error("Error fetching daily goal:", error.message);
            return { goal: 20, todayCount: 0, isAchieved: false };
        }
    },

    async updateDailyGoal(goal) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/userprogress/update-goal`, {
                method: "POST",
                body: JSON.stringify({ goal }),
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            return data;
        } catch (error) {
            console.error("Error updating daily goal:", error.message);
            throw error;
        }
    },

    async fetchBadges() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/userprogress/badges`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            return data;
        } catch (error) {
            console.error("Error fetching badges:", error.message);
            return { monthlyTotal: 0, status: [] };
        }
    },

    async deleteFlashcard(id) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/flashcards/delete-flashcard/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (error) {
            console.error("Error deleting flashcards:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
        }
    },

    async fetchReview(listId) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/flashcards/flashcardlist/${listId}/review`, {
                method: "GET",
            });
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (error) {
            console.error("Error fetching flashcard review:", error.message);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: "Không thể kết nối đến server. Vui lòng kiểm tra lỗi kết nối server. Hệ thống sẽ hiển thị dữ liệu mặc định."
                });
            }
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    }
};
// JSON → dùng Content-Type: application/json + JSON.stringify(data)
// FormData → không set Content-Type, fetch tự xử lý. Ví dụ: fetch sẽ tự đặt Content-Type thành multipart/form-data