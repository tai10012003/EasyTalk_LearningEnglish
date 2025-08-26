const API_URL = "http://localhost:3000";

export const fetchFlashcardLists = async (page = 1, limit = 5) => {
    const response = await fetch(`${API_URL}/flashcards/api/flashcard-list?page=${page}&limit=${limit}`);
     if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Lỗi khi fetch flashcard lists: " + errorText);
    }
    return response.json();
};

export const createFlashcardList = async (name, description) => {
    const response = await fetch(`${API_URL}/flashcards/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Lỗi khi tạo flashcard list: " + errorText);
    }
    return response.json();
};