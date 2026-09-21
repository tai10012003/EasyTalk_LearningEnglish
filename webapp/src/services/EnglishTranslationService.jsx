import { AuthService } from "./AuthService.jsx";

const API_URL = import.meta.env.VITE_API_URL;

export const EnglishTranslationService = {
    async getTranslation(contentType, contentId) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/english-translations/api/${contentType}/${contentId}`, {
            method: "GET",
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const responseData = await res.json();
        return responseData.data?.translation || null;
    },

    async saveTranslation(contentType, contentId, payload) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/english-translations/api/${contentType}/${contentId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const responseData = await res.json();
        return responseData.data;
    },

    async deleteTranslation(contentType, contentId) {
        const res = await AuthService.fetchWithAuth(`${API_URL}/english-translations/api/${contentType}/${contentId}`, {
            method: "DELETE",
        });
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const responseData = await res.json();
        return responseData.data;
    }
};
