import React, { useState, useEffect, useRef } from "react";
import { AuthService } from "@/services/AuthService";
import { toast } from "react-toastify";

function VerifyCode({ email, expiresAt, serverTime, onVerified }) {
    const [codeDigits, setCodeDigits] = useState(["", "", "", "", ""]);
    const [timer, setTimer] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const inputsRef = useRef([]);

    useEffect(() => {
        if (!expiresAt || !serverTime) return;
        const clientNow = Date.now();
        const diff = clientNow - serverTime;
        const remaining = Math.max(0, Math.floor((expiresAt - (clientNow - diff)) / 1000));
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
        if (value && index < 4) {
            inputsRef.current[index].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key == "Backspace") {
            if (!codeDigits[index] && index > 0) {
                inputsRef.current[index - 1].focus();
            }
        } else if (e.key == "ArrowRight") {
            if (index < codeDigits.length - 1) {
                inputsRef.current[index + 1].focus();
            }
        } else if (e.key == "ArrowLeft") {
            if (index > 0) {
                inputsRef.current[index - 1].focus();
            }
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
            const res = await AuthService.verifyCode(email, code);
            if (res.success) {
                toast.success(res.message || "Xác thực thành công!");
                onVerified();
            } else {
                toast.error(res.message || "Mã xác thực không hợp lệ!");
            }
        } catch {
            toast.error("Lỗi khi xác thực mã!");
        }
    };

    const handleResendCode = async () => {
        setIsResending(true);
        try {
            const res = await AuthService.forgotPassword(email);
            if (res.success) {
                toast.success("Đã gửi mã xác thực mới đến email!");
                const { expiresAt: newExpiresAt, serverTime: newServerTime } = res;
                const clientNow = Date.now();
                const diff = clientNow - newServerTime;
                const remaining = Math.max(0, Math.floor((newExpiresAt - (clientNow - diff)) / 1000));
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
        <div className="forgot-password-verify">
            <h2 className="forgot-password-title">Nhập mã xác thực</h2>
            <p className="forgot-password-timer">
                {timer > 0 ? (
                    <>Mã sẽ hết hạn sau: <strong>{timer}s</strong></>
                ) : (
                    <span style={{ color: "red" }}>Mã đã hết hạn!</span>
                )}
            </p>
            <form onSubmit={handleVerify} className="forgot-password-code-form">
                <div className="forgot-password-code-inputs">
                    {codeDigits.map((digit, index) => (
                        <input
                            key={index}
                            type="text"
                            className="forgot-password-code-input"
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
                    className="forgot-password-btn"
                    disabled={timer <= 0}
                >
                    Xác thực
                </button>
            </form>
            <button
                onClick={handleResendCode}
                disabled={timer > 0 || isResending}
                className={`forgot-password-resend-btn ${
                    timer > 0 || isResending ? "disabled" : ""
                }`}
            >
                {isResending ? "Đang gửi lại..." : "Gửi lại mã"}
            </button>
        </div>
    );
}

export default VerifyCode;