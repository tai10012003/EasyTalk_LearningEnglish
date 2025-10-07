import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const AddUser = ({ onSubmit, title, returnUrl }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        email:"",
        password: "",
        role: "",
        active: ""
    });

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
            active: "active"
        };
        onSubmit(dataToSubmit);
    };

    return (
        <div className="admin-user-add-container">
            <h1 className="admin-user-add-title">{title}</h1>
            <form
                id="admin-user-add-form"
                className="admin-user-add-form"
                onSubmit={handleSubmit}
            >
                <div className="admin-user-add-group">
                    <label htmlFor="admin-user-add-username">Username:</label>
                    <input
                        type="text"
                        id="admin-user-add-username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                <div className="admin-user-add-group">
                    <label htmlFor="admin-user-add-email">Email:</label>
                    <input
                        type="text"
                        id="admin-user-add-email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="form-control"
                    />
                </div>
                <div className="admin-user-add-group">
                    <label htmlFor="admin-user-add-password">Mật khẩu:</label>
                    <input
                        type="password"
                        id="admin-user-add-password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="form-control"
                        placeholder="Nhập mật khẩu"
                    />
                </div>
                <div className="admin-user-add-group">
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
                <button
                    type="submit"
                    className="btn btn-primary admin-user-add-btn mt-3"
                >
                    Lưu
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

export default AddUser;