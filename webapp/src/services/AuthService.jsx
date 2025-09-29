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
            if (!hasShownAlert) {
                hasShownAlert = true;
                window.alert("Không thể kết nối đến server. Vui lòng kiểm tra server backend đã bật chưa.");
            }
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
            if (!hasShownAlert) {
                hasShownAlert = true;
                window.alert("Không thể kết nối đến server hoặc có lỗi xảy ra.");
            }
            return { success: false, message: error.message || "Đăng ký thất bại" };
        }
    },

    resetAlertFlag() {
        hasShownAlert = false;
    }
};