import React, { useState } from "react";
import { AuthService } from "@/services/AuthService";
import { toast } from "react-toastify";

function ForgotPasswordForm({ onSuccess }) {
    const [email, setEmail] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await AuthService.forgotPassword(email);
            if (res.success) {
                toast.success(res.message);
                onSuccess(email, res.expiresAt, res.serverTime);
            } else {
                toast.error(res.message);
            }
        } catch {
            toast.error("Lỗi khi gửi mã xác thực!");
        }
    };

    return (
        <div className="forgot-password-form">
            <h2 className="forgot-password-title">Quên mật khẩu</h2>
            <form onSubmit={handleSubmit}>
                <label className="forgot-password-label">Email:</label>
                <input
                    type="email"
                    className="forgot-password-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    required
                />
                <button type="submit" className="forgot-password-btn">
                    Gửi mã xác thực
                </button>
            </form>
        </div>
    );
}

export default ForgotPasswordForm;