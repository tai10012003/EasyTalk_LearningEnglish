import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RegisterForm from '@/components/user/auth/RegisterForm.jsx';
import Mascot from '@/components/user/auth/Mascot.jsx';
import RegisterVerify from '@/components/user/auth/RegisterVerify.jsx';
import { AuthService } from '@/services/AuthService.jsx';

function Register() {
  const [pendingExpiresAt, setPendingExpiresAt] = useState(null);
  const [pendingServerTime, setPendingServerTime] = useState(null);
  const [pendingEmail, setPendingEmail] = useState(null);
  const [pendingData, setPendingData] = useState(null);

  useEffect(() => {
    document.title = "Đăng ký - EasyTalk";
  }, []);

  const handleBeforeUnload = (e) => {
    e.preventDefault();
    e.returnValue = "Bạn có chắc chắn muốn rời trang? Mã xác thực sẽ bị hủy!";
    return e.returnValue;
  };

  useEffect(() => {
    if (pendingEmail) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pendingEmail]);

  const handleRegister = async (username, email, password, confirmPassword) => {
    if (password !== confirmPassword) {
      toast.error("Mật khẩu và xác nhận mật khẩu không khớp!");
      return;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast.error("Mật khẩu phải ít nhất 8 ký tự, chứa chữ hoa, số và ký tự đặc biệt!");
      return;
    }
    try {
      const response = await AuthService.sendRegisterCode(username, email, password);
      if (response.success) {
        toast.success(response.message);
        setPendingEmail(email);
        setPendingData({ username, password });
        setPendingExpiresAt(response.expiresAt);
        setPendingServerTime(response.serverTime);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleVerifyCode = () => {
    window.removeEventListener("beforeunload", handleBeforeUnload);
    setPendingEmail(null); 
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
  };

  return (
    <div className="page-wrapper">
      <div className="auth-wrapper">
        <div className="container">
          <div className="row">
            <div className="col-sm-6 col-md-6 col-xl-6">
              <div className="auth-content">
                <div className="auth_title text-center mt-4">
                  <h4>ĐĂNG KÝ TÀI KHOẢN</h4>
                </div>
                <ToastContainer position="top-center" autoClose={2000} theme="colored" />
                <RegisterForm onSubmit={handleRegister} />
                <p className="auth-footer-text text-center">
                  Đã có tài khoản?{' '}
                  <a href="/login">Vui lòng đăng nhập tại đây !!</a>
                </p>
              </div>
            </div>
            <div className="col-sm-6 col-md-6 col-xl-6" style={{ padding: 0 }}>
              <Mascot />
            </div>
          </div>
        </div>
      </div>
      {pendingEmail && (
        <RegisterVerify
          email={pendingEmail}
          expiresAt={pendingExpiresAt}
          serverTime={pendingServerTime}
          onVerified={handleVerifyCode}
          onClose={() => setPendingEmail(null)}
        />
      )}
    </div>
  );
}

export default Register;