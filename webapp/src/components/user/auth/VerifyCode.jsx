import React, { useState } from "react";
import { AuthService } from "@/services/AuthService";
import { toast } from "react-toastify";

function VerifyCode({ email, onVerified }) {
    const [code, setCode] = useState("");

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            const res = await AuthService.verifyCode(email, code);
            if (res.message?.includes("Code verified")) {
                toast.success("Mã xác thực chính xác!");
                onVerified();
            } else {
                toast.error(res.message || "Mã xác thực không hợp lệ. Vui lòng nhập chính xác!");
            }
        } catch {
            toast.error("Lỗi xác thực mã!");
        }
    };

    return (
        <div className="forgot-password-verify">
            <h2 className="forgot-password-title">Nhập mã xác thực</h2>
            <form onSubmit={handleVerify}>
                <input
                    type="text"
                    className="forgot-password-input"
                    maxLength="5"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Nhập mã xác thực"
                    required
                />
                <button type="submit" className="forgot-password-btn">
                    Xác thực
                </button>
            </form>
        </div>
    );
}

export default VerifyCode;