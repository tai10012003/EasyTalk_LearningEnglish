import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Swal from "sweetalert2";
import { AuthService } from "@/services/AuthService.jsx";
import { UserService } from "@/services/UserService.jsx";

const PersonalInfo = () => {
    const { t, i18n } = useTranslation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ username: "", email: "" });
    const [isChanged, setIsChanged] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await AuthService.fetchWithAuth(`${import.meta.env.VITE_API_URL}/user/profile/data`, {
                    method: "GET" 
                });
                const data = await res.json();
                if (!data.success) throw new Error("Không thể tải thông tin người dùng!");
                const u = data.user;
                setUser(u);
                setFormData({
                    username: u.username || "",
                    email: u.email || "",
                });
            } catch (err) {
                console.error("Error fetching user:", err);
                Swal.fire({
                    icon: "error",
                    title: t("setting.personal.errorTitle"),
                    text: t("setting.personal.errorLoad"),
                });
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (!user) return;
        const changed =
            formData.username !== (user.username || "") ||
            formData.email !== (user.email || "");
        setIsChanged(changed);
    }, [formData, user]);

    const handleChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isChanged) return;
        try {
            await UserService.updateProfile(formData);
            await Swal.fire({
                icon: "success",
                title: t("setting.personal.successTitle"),
                text: t("setting.personal.successSave"),
            });
            setUser((prev) => ({
                ...prev,
                username: formData.username,
                email: formData.email,
            }));
            setIsChanged(false);
        } catch (err) {
            console.error("Error updating user:", err);
            await Swal.fire({
                icon: "error",
                title: t("setting.personal.errorTitle"),
                text: t("setting.personal.errorSave"),
            });
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (!user) return <p>Không tìm thấy người dùng.</p>;

    return (
        <div className="setting-content">
            <h3 className="setting-section-title">{t("setting.personal.title")}</h3>
            <p className="setting-section-desc">
                {t("setting.personal.description")}
            </p>
            <form className="setting-info-card" onSubmit={handleSubmit}>
                <div className="setting-info-row">
                    <label>{t("setting.personal.username")}</label>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="setting-input"
                        required
                    />
                </div>
                <div className="setting-info-row">
                    <label>{t("setting.personal.email")}</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="setting-input"
                        required
                    />
                </div>
                <div className="setting-info-row">
                    <label>{t("setting.personal.role")}</label>
                    <div className={`setting-info-role ${user.role == "admin" ? "admin" : "user"}`}>
                        {user.role == "admin" ? t("setting.personal.admin") : t("setting.personal.user")}
                    </div>
                </div>
                <div className="setting-info-row">
                    <label>{t("setting.personal.status")}</label>
                    <div className={`setting-status ${user.active ? "active" : "locked"}`}>
                        {user.active ? t("setting.personal.active") : t("setting.personal.locked")}
                    </div>
                </div>
                <div className="setting-info-row">
                    <button
                        type="submit"
                        className="setting-btn"
                        disabled={!isChanged}
                        style={{
                            opacity: isChanged ? 1 : 0.6,
                            cursor: isChanged ? "pointer" : "not-allowed",
                        }}
                    >
                        <i className="fas fa-save"></i> {t("setting.personal.saveChanges")}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PersonalInfo;