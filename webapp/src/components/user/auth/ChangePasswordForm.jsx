import React, { useState } from "react";
// import PropTypes from "prop-types";

const ChangePasswordForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
    });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const { currentPassword, newPassword, confirmNewPassword } = formData;
        if (newPassword !== confirmNewPassword) {
            onSubmit(null, null, null, "Mật khẩu mới và xác nhận mật khẩu không khớp!");
            return;
        }
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            onSubmit(null, null, null, "Mật khẩu phải ít nhất 8 ký tự, chứa chữ hoa, số và ký tự đặc biệt!");
            return;
        }
        onSubmit(currentPassword, newPassword, confirmNewPassword);
    };

    return (
        <div className="change-password-box">
            <h2 className="change-password-title">Đổi Mật Khẩu</h2>
            <form id="change-password-form" onSubmit={handleSubmit}>
                <div className="change-password-group">
                    <label htmlFor="currentPassword" className="change-password-label">
                        Mật khẩu hiện tại:
                    </label>
                    <input
                        type="password"
                        id="currentPassword"
                        className="change-password-input"
                        placeholder="Nhập mật khẩu hiện tại"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="change-password-group">
                    <label htmlFor="newPassword" className="change-password-label">
                        Mật khẩu mới:
                    </label>
                    <input
                        type="password"
                        id="newPassword"
                        className="change-password-input"
                        placeholder="Nhập mật khẩu mới"
                        value={formData.newPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="change-password-group">
                    <label htmlFor="confirmNewPassword" className="change-password-label">
                        Xác nhận mật khẩu:
                    </label>
                    <input
                        type="password"
                        id="confirmNewPassword"
                        className="change-password-input"
                        placeholder="Xác nhận mật khẩu mới"
                        value={formData.confirmNewPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" className="change-password-btn">
                    Lưu
                </button>
                <button
                    type="button"
                    className="change-password-btn-secondary"
                    onClick={() => (window.location.href = "/")}
                >
                    Quay lại trang chủ
                </button>
            </form>
        </div>
    );
};

// ChangePasswordForm.propTypes = {
//     onSubmit: PropTypes.func.isRequired,
// };

export default ChangePasswordForm;