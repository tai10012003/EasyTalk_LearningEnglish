const API_URL = "http://localhost:3000";

let hasShownAlert = false;

export const FlashcardService = {
    async fetchFlashcardLists(page = 1, limit = 6) {
        try {
            let query = `?page=${page}&limit=${limit}`;
            const res = await fetch(`${API_URL}/flashcards/api/flashcard-list${query}`);
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
            const res = await fetch(`${API_URL}/flashcards/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
            const res = await fetch(`${API_URL}/flashcards/flashcardlist/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
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
            const res = await fetch(`${API_URL}/flashcards/${id}`, {
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

    async fetchFlashcards(listId, page = 1, limit = 5) {
        try {
            const res = await fetch(`${API_URL}/flashcards/api/flashcardlist/${listId}?page=${page}&limit=${limit}`);
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
            const res = await fetch(`${API_URL}/flashcards/flashcardlist/${listId}`, {
                method: "POST",
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
            const res = await fetch(`${API_URL}/flashcards/update-flashcard/${id}`, {
                method: "PUT",
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
            const res = await fetch(`${API_URL}/flashcards/delete-flashcard/${id}`, {
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
            const res = await fetch(`${API_URL}/flashcards/flashcardlist/${listId}/review`);
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