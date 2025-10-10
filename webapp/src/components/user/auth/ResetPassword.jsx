import React, { useState } from "react";
import { AuthService } from "@/services/AuthService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function ResetPassword({ email, onCompleted }) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }
        try {
            const res = await AuthService.resetPassword(email, newPassword);
            if (res.message?.includes("successful")) {
                toast.success("Đặt lại mật khẩu thành công!");
                if (onCompleted) onCompleted();
                setTimeout(() => {
                    navigate("/login");
                }, 1500);
            } else {
                toast.error(res.message || "Lỗi đặt lại mật khẩu!");
            }
        } catch {
            toast.error("Không thể đặt lại mật khẩu!");
        }
    };

    return (
        <div className="forgot-password-reset">
            <h2 className="forgot-password-title">Đặt lại mật khẩu</h2>
            <form onSubmit={handleReset}>
                <input
                    type="password"
                    className="forgot-password-input"
                    placeholder="Mật khẩu mới"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                />
                <input
                    type="password"
                    className="forgot-password-input"
                    placeholder="Xác nhận mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />
                <button type="submit" className="forgot-password-btn">
                    Lưu mật khẩu mới
                </button>
            </form>
        </div>
    );
}

export default ResetPassword;