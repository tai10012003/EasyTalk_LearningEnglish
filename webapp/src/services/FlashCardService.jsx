const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
let hasShownAlert = false;

export const FlashCardService = {
    async fetchFlashcardLists(page = 1, limit = 12) {
        try {
            let query = `?page=${page}&limit=${limit}`;
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
                alert("Không thể kết nối đến server!");
            }
            return { flashcardLists: [], currentPage: 1, totalPages: 1 };
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
                alert("Không thể kết nối đến server!");
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
                alert("Không thể kết nối đến server!");
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
                alert("Không thể kết nối đến server!");
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
                alert("Không thể kết nối đến server!");
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
                alert("Không thể kết nối đến server!");
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
                alert("Không thể kết nối đến server!");
            }
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
                alert("Không thể kết nối đến server!");
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
                alert("Không thể kết nối đến server!");
            }
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    }
};
// JSON → dùng Content-Type: application/json + JSON.stringify(data)
// FormData → không set Content-Type, fetch tự xử lý. Ví dụ: fetch sẽ tự đặt Content-Type thành multipart/form-data