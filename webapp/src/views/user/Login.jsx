import React, { useState, useEffect } from 'react';
import LoginForm from '../../components/user/auth/LoginForm';
import Mascot from '../../components/user/auth/Mascot';
import SocialLoginButtons from '../../components/user/auth/SocialLoginButtons';
import { AuthService } from '../../services/AuthService';

function Login() {
  const [message, setMessage] = useState(null);
  
  useEffect(() => {
    document.title = "Đăng nhập - EasyTalk";
  }, []);
  const handleLogin = async (email, password) => {
    try {
      const data = await AuthService.login(email, password);
      // console.log("Login response:", data);
      // console.log("Token nhận được:", data.token);
      localStorage.setItem("token", data.token);
      setMessage({ type: "success", text: "Đăng nhập thành công !!" });
      setTimeout(() => {
        window.location.href = data.role == "admin" ? "/admin" : "/";
      }, 1000);
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    }
  };

  return (
    <div className="page-wrapper">
      <div className="auth-wrapper">
        <div className="container">
          <div className="row">
            <div className="col-sm-6 col-md-6 col-xl-6">
              <div className="auth-content">
                <div className="auth_title text-center mt-4">
                  <h4>ĐĂNG NHẬP TÀI KHOẢN</h4>
                </div>
                {message && (
                  <div className={`alert alert-${message.type} text-center mb-3`}>
                    {message.text}
                  </div>
                )}
                <LoginForm onSubmit={handleLogin} />
                <div className="auth-or-divider text-center my-4">
                  <div className="auth-divider"></div>
                  <span>hoặc</span>
                  <div className="auth-divider"></div>
                </div>
                <SocialLoginButtons />
                <p className="auth-footer-text text-center">
                  Không có tài khoản?{' '}
                  <a href="/register">Đăng ký ngay thôi !!</a>
                </p>
              </div>
            </div>
            <div className="col-sm-6 col-md-6 col-xl-6" style={{ padding: 0 }}>
              <Mascot />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;