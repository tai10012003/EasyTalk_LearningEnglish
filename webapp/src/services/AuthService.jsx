import i18n from "@/i18n";
const API_URL = import.meta.env.VITE_API_URL;
let hasShownAlert = false;
let isRefreshing = false;
let refreshSubscribers = [];
// import { PrizeService } from "./PrizeService.jsx";

function onRefreshed(token) {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback) {
  refreshSubscribers.push(callback);
}

export const AuthService = {
    async login(email, password) {
        try {
            const res = await fetch(`${API_URL}/user/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            localStorage.setItem("token", data.token);
            localStorage.setItem("refreshToken", data.refreshToken);
            localStorage.setItem("role", data.role);
            const lang = data.language || "vi";
            localStorage.setItem("language", lang);
            i18n.changeLanguage(lang);
            this.startTokenRefreshTimer();
            hasShownAlert = false;
            console.log("Login success:", data);
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
        return await res.json();
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
        return await res.json();
    },

    async refreshToken() {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }
        try {
            const res = await fetch(`${API_URL}/user/refresh-token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });
            if (!res.ok) {
                throw new Error("Failed to refresh token");
            }
            const data = await res.json();
            localStorage.setItem("token", data.token);
            console.log("✅ Token refreshed successfully");
            return data.token;
        } catch (error) {
            console.error("Error refreshing token:", error);
            this.logout();
            throw error;
        }
    },

    startTokenRefreshTimer() {
        const refreshInterval = 12 * 60 * 1000;
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        this.refreshTimer = setInterval(async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    await this.refreshToken();
                } catch (error) {
                    console.error("Auto refresh failed:", error);
                    clearInterval(this.refreshTimer);
                }
            }
        }, refreshInterval);
    },

    async fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem("token");
        const headers = {
            ...options.headers,
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        };
        let response = await fetch(url, { ...options, headers });
        if (response.status == 401 || response.status == 403) {
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const newToken = await this.refreshToken();
                    isRefreshing = false;
                    onRefreshed(newToken);
                } catch (error) {
                    isRefreshing = false;
                    console.error("Refresh token failed, logging out...");
                    this.logout();
                    throw error;
                }
            }
            return new Promise((resolve) => {
                addRefreshSubscriber(async (newToken) => {
                    headers["Authorization"] = `Bearer ${newToken}`;
                    const retryResponse = await fetch(url, { ...options, headers });
                    resolve(retryResponse);
                });
            });
        }
        return response;
    },

    getCurrentUser() {
        try {
            const userStr = localStorage.getItem("user");
            if (!userStr) {
                const token = localStorage.getItem("token");
                if (!token) return null;
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    return {
                        id: payload.id || payload.userId || payload.sub,
                        username: payload.username,
                        email: payload.email,
                        role: localStorage.getItem("role") || payload.role
                    };
                } catch (e) {
                    console.error("Error decoding token:", e);
                    return null;
                }
            }
            return JSON.parse(userStr);
        } catch (error) {
            console.error("Error getting current user:", error);
            return null;
        }
    },

    async logout() {
        const refreshToken = localStorage.getItem("refreshToken");
        const role = localStorage.getItem("role");
        try {
            if (refreshToken) {
                await fetch(`${API_URL}/user/logout`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refreshToken }),
                });
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("role");
            localStorage.removeItem("language");
            i18n.changeLanguage("vi");
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
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
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/user/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
            });

            const data = await res.json();

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
        return await res.json();
    },

    async verifyCode(email, code) {
        const res = await fetch(`${API_URL}/user/verify-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code }),
        });
        return await res.json();
    },

    async resetPassword(email, newPassword) {
        const res = await fetch(`${API_URL}/user/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, newPassword }),
        });
        return await res.json();
    },

    async resetTempPassword(userId) {
        try {
            const res = await fetch(`${API_URL}/user/reset-temp-password/${userId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });
            const data = await res.json();
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
        hasShownAlert = false;
    }
};

if (localStorage.getItem("token")) {
    AuthService.startTokenRefreshTimer();
}