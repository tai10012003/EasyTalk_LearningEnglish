const API_URL = import.meta.env.VITE_API_URL;
let hasShownAlert = false;
let isRefreshing = false;
let refreshSubscribers = [];

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
            this.startTokenRefreshTimer();
            hasShownAlert = false;
            console.log("Login success:", data);
            return data;
        } catch (error) {
            console.error("Error during login:", error.message);
            throw error;
        }
    },

    async register(username, email, password, confirmPassword) {
        try {
            const res = await fetch(`${API_URL}/user/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, email, password, confirmPassword }),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || `HTTP error! Status: ${res.status}`);
            }

            const data = await res.json();
            hasShownAlert = false;
            return { success: true, message: data.message || "Đăng ký thành công" };
        } catch (error) {
            console.error("Error registering:", error.message);
            return { success: false, message: error.message || "Đăng ký thất bại" };
        }
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
        if ((response.status == 401 || response.status == 403) && !isRefreshing) {
            isRefreshing = true;
            try {
                const newToken = await this.refreshToken();
                isRefreshing = false;
                onRefreshed(newToken);
                headers["Authorization"] = `Bearer ${newToken}`;
                response = await fetch(url, { ...options, headers });
            } catch (error) {
                isRefreshing = false;
                throw error;
            }
        }
        return response;
    },

    async logout() {
        const refreshToken = localStorage.getItem("refreshToken");
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
            if (this.refreshTimer) {
                clearInterval(this.refreshTimer);
            }
            window.location.href = "/login";
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