import i18n from "@/i18n";
const API_URL = import.meta.env.VITE_API_URL;
let accessToken = null;
let isRefreshing = false;
let refreshPromise = null;
let refreshSubscribers = [];
// import { PrizeService } from "./PrizeService.jsx";

function onRefreshed(token) {
  refreshSubscribers.forEach(({ callback }) => callback(token));
  refreshSubscribers = [];
}

function onRefreshFailed(error) {
  refreshSubscribers.forEach(({ reject }) => reject(error));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback, reject) {
  refreshSubscribers.push({ callback, reject });
}

async function isTokenExpiredResponse(response) {
    if (response.status !== 401) return false;
    try {
        const errorData = await response.clone().json();
        return errorData?.code === "TOKEN_EXPIRED";
    } catch {
        return false;
    }
}

function getTokenExpiration(token) {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp ? payload.exp * 1000 : null;
    } catch {
        return null;
    }
}

function decodeToken(token) {
    if (!token) return null;
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch {
        return null;
    }
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const AuthService = {
    setAccessToken(token) {
        accessToken = token || null;
    },
    getAccessToken() {
        return accessToken;
    },
    isAuthenticated() {
        return !!accessToken;
    },
    async bootstrapSession() {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        try {
            await this.refreshToken({ logoutOnFailure: false });
            return true;
        } catch {
            this.setAccessToken(null);
            return false;
        }
    },

    async login(email, password) {
        try {
            const res = await fetch(`${API_URL}/user/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
            }
            const responseData = await res.json();
            const data = responseData.data;
            this.setAccessToken(data.token);
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.setItem("role", data.role);
            const lang = data.language || "vi";
            localStorage.setItem("language", lang);
            i18n.changeLanguage(lang);
            this.startTokenRefreshTimer();
            console.log("Login success:", responseData);
            // await PrizeService.checkAndUnlockPrizes();
            return data;
        } catch (error) {
            console.error("Error during login:", error.message);
            throw error;
        }
    },

    async sendRegisterCode(username, email, password, confirmPassword) {
        const res = await fetch(`${API_URL}/user/register/send-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password, confirmPassword }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Lỗi khi gửi mã xác thực");
        }
        const responseData = await res.json();
        const data = responseData.data;
        return await data;
    },

    async verifyRegisterCode(email, code) {
        const res = await fetch(`${API_URL}/user/register/verify-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code }),
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Mã xác thực không đúng");
        }
        const responseData = await res.json();
        const data = responseData.data;
        return await data;
    },

    async refreshToken({ logoutOnFailure = true, retryOnReuse = true } = {}) {
        if (refreshPromise) {
            return refreshPromise;
        }
        refreshPromise = (async () => {
            const res = await fetch(`${API_URL}/user/refresh-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
            });
            if (!res.ok) {
                let errorData = {};
                try {
                    errorData = await res.json();
                } catch {
                    errorData = {};
                }
                if (errorData.code === "REFRESH_TOKEN_REUSED" && retryOnReuse) {
                    await wait(250);
                    refreshPromise = null;
                    return await this.refreshToken({ logoutOnFailure, retryOnReuse: false });
                }
                const error = new Error(errorData.message || "Failed to refresh token");
                error.code = errorData.code;
                throw error;
            }
            const responseData = await res.json();
            const data = responseData.data;
            this.setAccessToken(data.token);
            localStorage.removeItem("token");
            if (data.role) {
                localStorage.setItem("role", data.role);
            }
            if (data.language) {
                localStorage.setItem("language", data.language);
                i18n.changeLanguage(data.language);
            }
            this.startTokenRefreshTimer();
            console.log("Token refreshed successfully");
            return data.token;
        })();
        try {
            return await refreshPromise;
        } catch (error) {
            console.error("Error refreshing token:", error);
            if (logoutOnFailure) {
                this.logout();
            }
            throw error;
        } finally {
            refreshPromise = null;
        }
    },

    startTokenRefreshTimer() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        const token = this.getAccessToken();
        const expiresAt = getTokenExpiration(token);
        const refreshIn = expiresAt ? Math.max(expiresAt - Date.now() - 60 * 1000, 30 * 1000) : 12 * 60 * 1000;
        this.refreshTimer = setTimeout(async () => {
            if (this.getAccessToken()) {
                try {
                    await this.refreshToken();
                } catch (error) {
                    console.error("Auto refresh failed:", error);
                    clearTimeout(this.refreshTimer);
                }
            }
        }, refreshIn);
    },

    async fetchWithAuth(url, options = {}) {
        const token = this.getAccessToken();
        const isFormData = options.body instanceof FormData;
        const headers = {
            ...options.headers,
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        if (isFormData) {
            delete headers["Content-Type"];
            delete headers["content-type"];
        } else if (!headers["Content-Type"] && !headers["content-type"]) {
            headers["Content-Type"] = "application/json";
        }
        let response = await fetch(url, { ...options, headers });
        if (await isTokenExpiredResponse(response)) {
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const newToken = await this.refreshToken();
                    isRefreshing = false;
                    onRefreshed(newToken);
                    headers["Authorization"] = `Bearer ${newToken}`;
                    return fetch(url, { ...options, headers });
                } catch (error) {
                    isRefreshing = false;
                    onRefreshFailed(error);
                    console.error("Refresh token failed, logging out...");
                    this.logout();
                    throw error;
                }
            }
            return new Promise((resolve, reject) => {
                addRefreshSubscriber(async (newToken) => {
                    try {
                        headers["Authorization"] = `Bearer ${newToken}`;
                        const retryResponse = await fetch(url, { ...options, headers });
                        resolve(retryResponse);
                    } catch (error) {
                        reject(error);
                    }
                }, reject);
            });
        }
        return response;
    },

    getCurrentUser() {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                const token = this.getAccessToken();
                if (!token) return null;
                const payload = decodeToken(token);
                if (!payload) return null;
                return {
                    id: payload.id || payload.userId || payload.sub,
                    username: payload.username,
                    email: payload.email,
                    role: localStorage.getItem("role") || payload.role
                };
            }
            return JSON.parse(userStr);
        } catch (error) {
            console.error("Error getting current user:", error);
            return null;
        }
    },

    async logout() {
        const role = localStorage.getItem("role");
        try {
            const token = this.getAccessToken();
            const headers = { "Content-Type": "application/json" };
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }
            await fetch(`${API_URL}/user/logout`, {
                method: "POST",
                headers,
                credentials: "include",
            });
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            this.setAccessToken(null);
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("role");
            localStorage.removeItem("language");
            localStorage.removeItem("user");
            i18n.changeLanguage("vi");
            if (this.refreshTimer) {
                clearTimeout(this.refreshTimer);
            }
            if (role == "admin") {
                window.location.href = "/login";
            } else {
                window.location.href = "/";
            }
        }
    },

    async changePassword(currentPassword, newPassword, confirmNewPassword) {
        try {
            const res = await this.fetchWithAuth(`${API_URL}/user/change-password`, {
                method: "POST",
                body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
            });
            const responseData = await res.json();
            const data = responseData.data;
            if (!res.ok) {
                throw new Error(data.message || "Lỗi khi đổi mật khẩu");
            }
            return { success: true, message: data.message || "Đổi mật khẩu thành công" };
        } catch (error) {
            console.error("Error changing password:", error.message);
            return { success: false, message: error.message || "Đổi mật khẩu thất bại" };
        }
    },

    async forgotPassword(email) {
        const res = await fetch(`${API_URL}/user/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        const responseData = await res.json();
        const data = responseData.data;
        return await data;
    },

    async verifyCode(email, code) {
        const res = await fetch(`${API_URL}/user/verify-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code }),
        });
        const responseData = await res.json();
        const data = responseData.data;
        return await data;
    },

    async resetPassword(email, newPassword) {
        const res = await fetch(`${API_URL}/user/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, newPassword }),
        });
        const responseData = await res.json();
        const data = responseData.data;
        return await data;
    },

    async resetTempPassword(userId) {
        try {
            const res = await this.fetchWithAuth(`${API_URL}/user/reset-temp-password/${userId}`, {
                method: "POST",
            });
            const responseData = await res.json();
            const data = responseData.data;
            if (!res.ok) {
                throw new Error(data.message || "Không thể đặt lại mật khẩu tạm thời!");
            }
            console.log("Reset temp password success:", data);
            return data;
        } catch (error) {
            console.error("Error resetting temp password:", error.message);
            return { success: false, message: error.message || "Lỗi hệ thống khi đặt lại mật khẩu tạm thời!" };
        }
    },

    resetAlertFlag() {
    }
};
