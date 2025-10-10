import React from "react";
import { AuthService } from "@/services/AuthService";
import ChangePasswordForm from "@/components/user/auth/ChangePasswordForm";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChangePassword = () => {
    const handleChangePassword = async (currentPassword, newPassword, confirmNewPassword) => {
        const result = await AuthService.changePassword(currentPassword, newPassword, confirmNewPassword);
        if (result.success) {
            toast.success("Mật khẩu thay đổi thành công!", {
                position: "top-right",
                autoClose: 2500,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
            setTimeout(() => {
                window.location.href = "/login";
            }, 2500);
        } else {
            toast.error(result.message, {
                position: "top-right",
                autoClose: 3000,
            });
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