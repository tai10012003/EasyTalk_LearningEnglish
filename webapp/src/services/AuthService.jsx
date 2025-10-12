const API_URL = import.meta.env.VITE_API_URL;
let hasShownAlert = false;

export const AuthService = {
    async login(email, password) {
        try {
            const res = await fetch(`${API_URL}/api/login`, {
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
            const res = await fetch(`${API_URL}/api/register`, {
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
            console.log("Register success:", data);
            return { success: true, message: data.message || "Đăng ký thành công" };
        } catch (error) {
            console.error("Error registering:", error.message);
            return { success: false, message: error.message || "Đăng ký thất bại" };
        }
    },

    async changePassword(currentPassword, newPassword, confirmNewPassword) {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_URL}/change-password`, {
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
        const res = await fetch(`${API_URL}/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        return await res.json();
    },

    async verifyCode(email, code) {
        const res = await fetch(`${API_URL}/verify-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code }),
        });
        return await res.json();
    },

    async resetPassword(email, newPassword) {
        const res = await fetch(`${API_URL}/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, newPassword }),
        });
        return await res.json();
    },

    async resetTempPassword(userId) {
        try {
            const res = await fetch(`${API_URL}/admin/user/reset-temp-password/${userId}`, {
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