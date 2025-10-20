import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthService } from "@/services/AuthService";
import Swal from "sweetalert2";

const UpdateUser = ({ onSubmit, title, initialData, returnUrl }) => {
    const navigate = useNavigate();
    const [tempPassword, setTempPassword] = useState("");
    const [formData, setFormData] = useState({
        username: "",
        email:"",
        password: "",
        role: "",
        active: ""
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                username: initialData.username || "",
                email: initialData.email || "",
                password: initialData.password || "",
                role: initialData.role,
                active: initialData.active
            });
        }
    }, [initialData]);

    const handleResetTempPassword = async () => {
        const result = await Swal.fire({
            title: "Xác nhận",
            text: "Bạn có chắc muốn đặt lại mật khẩu tạm thời cho người dùng này không?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Đồng ý",
            cancelButtonText: "Hủy"
        });
        if (!result.isConfirmed) return;
        try {
            const data = await AuthService.resetTempPassword(initialData._id);
            if (data.success) {
                setTempPassword(data.tempPassword);
                Swal.fire({
                    icon: "success",
                    title: "Thành công",
                    text: "Đặt lại mật khẩu tạm thời thành công! Mật khẩu đã được gửi đến email người dùng.",
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Lỗi",
                    text: data.message || "Không thể đặt lại mật khẩu tạm thời!",
                });
            }
        } catch (error) {
            console.error("Error resetting temp password:", error);
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text: "Lỗi hệ thống khi đặt lại mật khẩu tạm thời!",
            });
        }
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: files ? files[0] : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = {
            username: formData.username,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            active: formData.active
        };
        onSubmit(dataToSubmit, initialData._id);
    };

    return (
        <div className="admin-user-update-container">
            <h1 className="admin-user-update-title">{title}</h1>
            <form
                id="admin-user-update-form"
                className="admin-user-update-form"
                onSubmit={handleSubmit}
            >
                <div className="admin-user-update-group">
                    <label htmlFor="admin-user-update-username">Username:</label>
                    <input
                        type="text"
                        id="admin-user-update-username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                <div className="admin-user-update-group">
                    <label htmlFor="admin-user-update-email">Email:</label>
                    <input
                        type="text"
                        id="admin-user-update-email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                <button
                    type="button"
                    className="admin-user-update-btn-reset mt-3 btn btn-warning"
                    onClick={handleResetTempPassword}
                >
                    🔑 Đặt lại mật khẩu tạm thời
                </button>
                {tempPassword && (
                    <div className="admin-user-update-temp-password mt-3">
                        <p>
                            Mật khẩu tạm thời: <strong>{tempPassword}</strong>
                        </p>
                    </div>
                )}
                <div className="admin-user-update-group">
                    <label>Vai trò:</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                        className="form-select"
                    >
                        <option value="">-- Chọn vai trò --</option>
                        <option value="user">Người dùng</option>
                        <option value="admin">Quản trị viên</option>
                    </select>
                </div>
                <div className="admin-user-update-group">
                    <label>Trạng thái tài khoản:</label>
                    <select
                        name="active"
                        value={formData.active}
                        onChange={handleChange}
                        required
                        className="form-select"
                    >
                        <option value="">-- Chọn trạng thái --</option>
                        <option value="active">Hoạt động</option>
                        <option value="locked">Khóa tài khoản</option>
                    </select>
                </div>
                {initialData.updatedAt && (
                    <div className="admin-user-update-group">
                        <label>Cập nhật gần nhất:</label>
                        <p className="form-control-plaintext">
                            {new Date(initialData.updatedAt).toLocaleString("vi-VN")}
                        </p>
                    </div>
                )}
                <button
                    type="submit"
                    className="btn btn-primary admin-user-update-btn mt-3"
                >
                    Cập nhật
                </button>
                <button
                    type="button"
                    className="mt-3 admin-user-return-btn btn btn-secondary"
                    onClick={() => navigate(`${returnUrl}`)}
                >
                    Quay lại
                </button>
            </form>
        </div>
    );
};

export default UpdateUser;