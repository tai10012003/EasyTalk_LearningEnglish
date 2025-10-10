import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ForgotPasswordForm from "@/components/user/auth/ForgotPasswordForm";
import VerifyCode from "@/components/user/auth/VerifyCode";
import ResetPassword from "@/components/user/auth/ResetPassword";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function ForgotPassword() {
    const [step, setStep] = useState("email");
    const [email, setEmail] = useState("");
    const navigate = useNavigate();

    const handleEmailSubmitted = (submittedEmail) => {
        setEmail(submittedEmail);
        setStep("verify");
    };

    const handleCodeVerified = () => {
        setStep("reset");
    };

    const handleResetCompleted = () => {
        setTimeout(() => {
            navigate("/login");
        }, 2000);
    };

    return (
        <div className="forgot-password-wrapper">
            <div className="forgot-password-container">
                {step == "email" && (
                    <ForgotPasswordForm onSuccess={handleEmailSubmitted} />
                )}
                {step == "verify" && (
                    <VerifyCode email={email} onVerified={handleCodeVerified} />
                )}
                {step == "reset" && (
                    <ResetPassword email={email} onCompleted={handleResetCompleted} />
                )}
                {step == "done" && (
                    <p className="forgot-password-success">
                        Mật khẩu đã được đặt lại thành công! Bạn có thể đăng nhập.
                    </p>
                )}
            </div>
            <ToastContainer position="top-center" autoClose={3000} />
        </div>
    );
}

export default ForgotPassword;