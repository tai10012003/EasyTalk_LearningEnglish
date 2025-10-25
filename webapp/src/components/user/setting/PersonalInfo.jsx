import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { AuthService } from "@/services/AuthService.jsx";
import { UserService } from "@/services/UserService.jsx";

const PersonalInfo = () => {
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
                    title: "Lỗi",
                    text: "Không thể tải thông tin người dùng!",
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
                title: "Thành công!",
                text: "Cập nhật thông tin cá nhân thành công!",
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
                title: "Thất bại!",
                text: "Có lỗi khi cập nhật thông tin!",
            });
        }
    };

    if (loading) return <p>Đang tải dữ liệu...</p>;
    if (!user) return <p>Không tìm thấy người dùng.</p>;

    return (
        <div className="setting-content">
            <h3 className="setting-section-title">Thông tin cá nhân</h3>
            <p className="setting-section-desc">
                Quản lý thông tin cá nhân của bạn.
            </p>
            <form className="setting-info-card" onSubmit={handleSubmit}>
                <div className="setting-info-row">
                    <label>Tên người dùng</label>
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
                    <label>Email</label>
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
                    <label>Vai trò</label>
                    <div className={`setting-info-role ${user.role == "admin" ? "admin" : "user"}`}>
                        {user.role == "admin" ? "Quản trị viên" : "Người dùng"}
                    </div>
                </div>
                <div className="setting-info-row">
                    <label>Trạng thái</label>
                    <div className={`setting-status ${user.active ? "active" : "locked"}`}>
                        {user.active ? "Hoạt động" : "Bị khóa"}
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
                        <i className="fas fa-save"></i> Lưu thay đổi
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PersonalInfo;