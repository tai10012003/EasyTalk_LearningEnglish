import React from "react";
import { AuthService } from "@/services/AuthService";
import ChangePasswordForm from "@/components/user/auth/ChangePasswordForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChangePassword = () => {
    const handleChangePassword = async (currentPassword, newPassword, confirmNewPassword) => {
        try {
            const result = await AuthService.changePassword(currentPassword, newPassword, confirmNewPassword);
            if (result.success) {
                toast.success(result.message);
                setTimeout(() => window.location.href = "/login", 2500);
            } else {
                toast.error(result.message);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Đã có lỗi xảy ra!");
        }
    };

    return (
        <div className="change-password-container">
            <ChangePasswordForm onSubmit={handleChangePassword} />
            <ToastContainer position="top-center" autoClose={3000} />
        </div>
    );
};

export default ChangePassword;