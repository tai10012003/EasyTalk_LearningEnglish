const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from './AuthService.jsx';
import Swal from "sweetalert2";

let hasShownAlert = false;
const requestCache = new Map();
const REQUEST_CACHE_TTL = 10000;

function getCachedRequest(key, fetcher) {
    const now = Date.now();
    const cached = requestCache.get(key);
    if (cached && cached.expiresAt > now) {
        return cached.promise;
    }

    const promise = fetcher().catch((error) => {
        requestCache.delete(key);
        throw error;
    });
    requestCache.set(key, {
        promise,
        expiresAt: now + REQUEST_CACHE_TTL
    });
    return promise;
}

export const LearningAgentService = {
    async getDailyPlan(targetMinutes = null, options = {}) {
        const { showAlert = true } = options;
        const cacheKey = `daily-plan:${targetMinutes ?? "default"}`;
        return getCachedRequest(cacheKey, async () => {
            try {
                const query = targetMinutes ? `?${new URLSearchParams({ targetMinutes: targetMinutes.toString() }).toString()}` : "";
                const res = await AuthService.fetchWithAuth(`${API_URL}/agent/daily-plan${query}`, {
                    method: "GET",
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
                }
                const responseData = await res.json();
                hasShownAlert = false;
                return responseData.data;
            } catch (error) {
                console.error("Error fetching AI daily plan:", error.message);
                if (showAlert && !hasShownAlert) {
                    hasShownAlert = true;
                    Swal.fire({
                        icon: "warning",
                        title: "Tạm thời chưa tải được kế hoạch AI",
                        text: "Bạn có thể thử lại sau ít phút.",
                        timer: 3000,
                        showConfirmButton: false
                    });
                }
                throw error;
            }
        });
    },

    async getCoachGuide(targetMinutes = null, options = {}) {
        const { showAlert = true } = options;
        const cacheKey = `coach-guide:${targetMinutes ?? "default"}`;
        return getCachedRequest(cacheKey, async () => {
            try {
                const query = targetMinutes ? `?${new URLSearchParams({ targetMinutes: targetMinutes.toString() }).toString()}` : "";
                const res = await AuthService.fetchWithAuth(`${API_URL}/agent/guide/coach${query}`, {
                    method: "GET",
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
                }
                const responseData = await res.json();
                hasShownAlert = false;
                return responseData.data || responseData;
            } catch (error) {
                console.error("Error fetching AI coach guide:", error.message);
                if (showAlert && !hasShownAlert) {
                    hasShownAlert = true;
                    Swal.fire({
                        icon: "warning",
                        title: "Tạm thời chưa tải được hướng dẫn AI",
                        text: "Bạn vẫn có thể xem kế hoạch học như bình thường.",
                        timer: 3000,
                        showConfirmButton: false
                    });
                }
                throw error;
            }
        });
    },

    async getMemory() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/agent/memory`, {
                method: "GET",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            hasShownAlert = false;
            return responseData.data;
        } catch (error) {
            console.error("Error fetching learner memory:", error.message);
            throw error;
        }
    },

    async getMemoryOptions() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/agent/memory/options`, {
                method: "GET",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            hasShownAlert = false;
            return responseData.data;
        } catch (error) {
            console.error("Error fetching learner memory options:", error.message);
            throw error;
        }
    },

    async updateMemory(memory) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/agent/memory`, {
                method: "PUT",
                body: JSON.stringify(memory),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            hasShownAlert = false;
            requestCache.clear();
            return responseData.data?.memory || responseData.data;
        } catch (error) {
            console.error("Error updating learner memory:", error.message);
            throw error;
        }
    },

    async updateStudyPreferences(targetStudyMinutes) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/agent/memory/study-preferences`, {
                method: "PUT",
                body: JSON.stringify({ targetStudyMinutes }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            hasShownAlert = false;
            requestCache.clear();
            return responseData.data?.memory || responseData.data?.memory || responseData.data;
        } catch (error) {
            console.error("Error updating study preferences:", error.message);
            throw error;
        }
    },

    async getTodayUsage() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/agent/usage/today`, {
                method: "GET",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            hasShownAlert = false;
            return responseData.data;
        } catch (error) {
            console.error("Error fetching AI usage summary:", error.message);
            throw error;
        }
    },

    async testProvider() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/agent/provider/test`, {
                method: "POST",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            hasShownAlert = false;
            return responseData.data;
        } catch (error) {
            console.error("Error testing AI provider:", error.message);
            throw error;
        }
    },

    async startChatSession(options = {}) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/agent/chat/start`, {
                method: "POST",
                body: JSON.stringify(options),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            hasShownAlert = false;
            return responseData.data;
        } catch (error) {
            console.error("Error starting agent chat session:", error.message);
            throw error;
        }
    },

    async sendChatMessage(sessionId, message) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/agent/chat/message`, {
                method: "POST",
                body: JSON.stringify({ sessionId, message }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            hasShownAlert = false;
            return responseData.data;
        } catch (error) {
            console.error("Error sending agent chat message:", error.message);
            throw error;
        }
    },

    async finishChatSession(sessionId) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/agent/chat/${sessionId}/finish`, {
                method: "POST",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            hasShownAlert = false;
            return responseData.data;
        } catch (error) {
            console.error("Error finishing agent chat session:", error.message);
            throw error;
        }
    },

    async getRecentLearningEvents(limit = 6) {
        try {
            const query = new URLSearchParams({ limit: limit.toString() }).toString();
            const res = await AuthService.fetchWithAuth(`${API_URL}/agent/learning-events/recent?${query}`, {
                method: "GET",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            hasShownAlert = false;
            return responseData.data?.events || responseData.events || responseData.data || [];
        } catch (error) {
            console.error("Error fetching recent learning events:", error.message);
            throw error;
        }
    },

    async getModes(activityType) {
        try {
            const query = activityType ? `?${new URLSearchParams({ activityType }).toString()}` : "";
            const res = await AuthService.fetchWithAuth(`${API_URL}/agent/modes${query}`, {
                method: "GET",
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            hasShownAlert = false;
            return responseData.data?.modes || responseData.modes || [];
        } catch (error) {
            console.error("Error fetching agent modes:", error.message);
            throw error;
        }
    },

    async synthesizeCoachSpeech(text, options = {}) {
        const timeoutMs = options.timeoutMs || 4500;
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/agent/tts`, {
                method: "POST",
                body: JSON.stringify({ text }),
                signal: controller.signal,
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || `HTTP error! Status: ${res.status}`);
            }
            hasShownAlert = false;
            return await res.blob();
        } catch (error) {
            console.error("Error generating coach speech:", error.message);
            throw error;
        } finally {
            window.clearTimeout(timeoutId);
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    }
};
