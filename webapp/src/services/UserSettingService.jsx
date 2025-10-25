import Swal from "sweetalert2";
const API_URL = import.meta.env.VITE_API_URL;
import { AuthService } from "./AuthService.jsx";
let hasShownAlert = false;

export const UserSettingService = {
    async getUserSettings() {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/setting/api/usersettings`, {
                method: "GET",
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || `HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (err) {
            console.error("Error fetching user settings:", err);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể kết nối đến server để lấy cài đặt. Vui lòng kiểm tra kết nối hoặc thử lại sau."
                });
            }
            throw err;
        }
    },

    async updateUserSettings(settings) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/setting/api/usersettings`, {
                method: "PUT",
                body: JSON.stringify(settings),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || `HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (err) {
            console.error("Error updating user settings:", err);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Không thể lưu cài đặt. Vui lòng kiểm tra kết nối tới server."
                });
            }
            throw err;
        }
    },

    async updateUserSettingsSection(section, payload) {
        try {
            const res = await AuthService.fetchWithAuth(`${API_URL}/setting/api/usersettings/${encodeURIComponent(section)}`, {
                method: "PUT",
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || errData.message || `HTTP error! Status: ${res.status}`);
            }
            const data = await res.json();
            hasShownAlert = false;
            return data;
        } catch (err) {
            console.error(`Error updating user settings section [${section}]:`, err);
            if (!hasShownAlert) {
                hasShownAlert = true;
                Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: `Không thể cập nhật cài đặt (${section}). Vui lòng kiểm tra kết nối server.`
                });
            }
            throw err;
        }
    },

    async getUserSettingsSection(section) {
        const all = await this.getUserSettings();
        return all?.[section] ?? null;
    },

    getDefaultSettings() {
        return {
            interface: {
                theme: "light",
                fontSize: 13,
                fontFamily: "Inter"
            },
            general: {
                language: "vn",
                timezone: "Asia/Ho_Chi_Minh",
                dateFormat: "DD/MM/YYYY"
            },
            security: {
                twoFA: false,
                googleLogin: true
            },
            notifications: {
                info: true,
                promo: false,
                success: true,
                warning: true,
                system: true,
                update: true,
                reminder: true,
                email: true,
                push: true
            }
        };
    }
};