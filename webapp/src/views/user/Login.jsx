import React, { useState } from 'react';
import LoginForm from '../../components/user/auth/loginForm';
import Mascot from '../../components/user/auth/Mascot';
import SocialLoginButtons from '../../components/user/auth/SocialLoginButtons';

function Login() {
  const [message, setMessage] = useState(null);

  const handleLogin = async (email, password) => {
    const mockResponse = {
      success: true,
      token: 'mock-token',
      role: email.includes('admin') ? 'admin' : 'user',
      message: 'Đăng nhập thành công !!',
    };

    if (!email || !password) {
      mockResponse.success = false;
      mockResponse.message = 'Vui lòng nhập email và mật khẩu';
    } else if (!email.includes('@')) {
      mockResponse.success = false;
      mockResponse.message = 'Email không hợp lệ';
    }

    if (mockResponse.success) {
      localStorage.setItem('token', mockResponse.token);
      setMessage({ type: 'success', text: mockResponse.message });
      setTimeout(() => {
        window.location.href = mockResponse.role === 'admin' ? '/admin' : '/';
      }, 1000);
    } else {
      setMessage({ type: 'error', text: mockResponse.message });
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