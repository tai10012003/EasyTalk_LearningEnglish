import React, { useState } from 'react';
import RegisterForm from '../../components/user/auth/RegisterForm';
import Mascot from '../../components/user/auth/Mascot';
// import SocialLoginButtons from '../../components/user/auth/SocialLoginButtons';

function Register() {
  const [message, setMessage] = useState(null);

  const handleRegister = async (username, email, password, confirmPassword) => {
    const mockResponse = {
      success: true,
      message: 'Đăng ký tài khoản thành công !!',
    };

    if (!username || !email || !password || !confirmPassword) {
      mockResponse.success = false;
      mockResponse.message = 'Vui lòng nhập đầy đủ thông tin';
    } else if (username.length > 10) {
      mockResponse.success = false;
      mockResponse.message = 'Tên không được vượt quá 10 ký tự';
    } else if (!email.includes('@')) {
      mockResponse.success = false;
      mockResponse.message = 'Email không hợp lệ';
    } else if (password.length < 6) {
      mockResponse.success = false;
      mockResponse.message = 'Mật khẩu phải có ít nhất 6 ký tự';
    } else if (password !== confirmPassword) {
      mockResponse.success = false;
      mockResponse.message = 'Mật khẩu không khớp';
    }

    if (mockResponse.success) {
      setMessage({ type: 'success', text: mockResponse.message });
      setTimeout(() => {
        window.location.href = '/login';
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
                                <h4>ĐĂNG KÝ TÀI KHOẢN</h4>
                            </div>
                            {message && (
                                <div className={`alert alert-${message.type} text-center mb-3`}>
                                    {message.text}
                                </div>
                            )}
                            <RegisterForm onSubmit={handleRegister} />
                            {/* <div className="auth-or-divider text-center my-4">
                                <div className="auth-divider"></div>
                                    <span>hoặc</span>
                                <div className="auth-divider"></div>
                            </div> */}
                            {/* <SocialLoginButtons /> */}
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
    </div>
  );
}

export default Register;