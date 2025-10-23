import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { AuthService } from "@/services/AuthService";

function RegisterVerify({ email, expiresAt, serverTime, onVerified, onClose }) {
  const [codeDigits, setCodeDigits] = useState(["", "", "", "", ""]);
    const [timer, setTimer] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const inputsRef = useRef([]);

    useEffect(() => {
        if (!expiresAt || !serverTime) return;
        const clientNow = Date.now();
        const offset = clientNow - serverTime;
        const remaining = Math.max(0, Math.floor((expiresAt - (clientNow - offset)) / 1000));
        setTimer(remaining);
    }, [expiresAt, serverTime]);

    useEffect(() => {
        if (timer <= 0) return;
        const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
        return () => clearInterval(countdown);
    }, [timer]);

    const handleChange = (value, index) => {
        if (!/^[0-9]?$/.test(value)) return;
        const updated = [...codeDigits];
        updated[index] = value;
        setCodeDigits(updated);
        if (value && index < 4) inputsRef.current[index].focus();
    };

    const handleKeyDown = (e, index) => {
        if (e.key == "Backspace") {
            if (!codeDigits[index] && index > 0) inputsRef.current[index - 1].focus();
        } else if (e.key == "ArrowRight" && index < 4) {
            inputsRef.current[index + 1].focus();
        } else if (e.key == "ArrowLeft" && index > 0) {
            inputsRef.current[index - 1].focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const code = codeDigits.join("");
        if (code.length < 5) {
            toast.error("Vui lòng nhập đủ 5 số!");
            return;
        }
        try {
            const res = await AuthService.verifyRegisterCode(email, code);
            if (res.success) {
                toast.success(res.message || "Xác thực thành công!");
                onVerified();
            } else {
                toast.error(res.message || "Mã xác thực không hợp lệ!");
            }
        } catch (error) {
            toast.error(error.message || "Lỗi khi xác thực mã!");
        }
    };

    const handleResendCode = async () => {
        setIsResending(true);
        try {
            const res = await AuthService.sendRegisterCode("", email, "");
            if (res.success) {
                toast.success("Đã gửi mã xác thực mới đến email!");
                const { expiresAt: newExpiresAt, serverTime: newServerTime } = res;
                const clientNow = Date.now();
                const offset = clientNow - newServerTime;
                const remaining = Math.max(0, Math.floor((newExpiresAt - (clientNow - offset)) / 1000));
                setTimer(remaining);
                setCodeDigits(["", "", "", "", ""]);
                inputsRef.current[0].focus();
            } else {
                toast.error(res.message || "Không thể gửi lại mã!");
            }
        } catch {
            toast.error("Lỗi khi gửi lại mã!");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="register-verify-overlay">
            <div className="register-verify-modal">
                <h4 className="register-verify-title">Xác thực email</h4>
                <p className="register-verify-text">
                    Chúng tôi đã gửi mã xác thực 5 số tới <strong>{email}</strong>. Vui lòng nhập mã để hoàn tất đăng ký.
                </p>
                <p className="register-verify-timer">
                    {timer > 0 ? (
                        <>Mã sẽ hết hạn sau: <strong>{timer}s</strong></>
                    ) : (
                        <span style={{ color: "red" }}>Mã đã hết hạn!</span>
                    )}
                </p>
                <form className="register-verify-form" onSubmit={handleVerify}>
                    <div className="register-verify-inputs">
                        {codeDigits.map((digit, index) => (
                        <input
                            key={index}
                            type="text"
                            className="register-verify-input"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleChange(e.target.value, index)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            ref={(el) => (inputsRef.current[index] = el)}
                        />
                        ))}
                    </div>
                    <button
                        type="submit"
                        className="register-verify-btn"
                        disabled={timer <= 0}
                    >
                        Xác thực
                    </button>
                    <button
                        type="button"
                        className={`register-verify-resend-btn ${timer > 0 || isResending ? "disabled" : ""}`}
                        onClick={handleResendCode}
                        disabled={timer > 0 || isResending}
                    >
                        {isResending ? "Đang gửi lại..." : "Gửi lại mã"}
                    </button>
                    <button type="button" className="register-verify-close-btn" onClick={onClose}>
                        Hủy
                    </button>
                </form>
            </div>
        </div>
    );
}

export default RegisterVerify;