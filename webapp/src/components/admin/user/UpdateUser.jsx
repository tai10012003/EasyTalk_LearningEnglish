import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const UpdateUser = ({ onSubmit, title, initialData, returnUrl }) => {
    const navigate = useNavigate();
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