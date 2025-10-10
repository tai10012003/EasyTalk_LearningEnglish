import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RegisterForm from '@/components/user/auth/RegisterForm.jsx';
import Mascot from '@/components/user/auth/Mascot.jsx';
import { AuthService } from '@/services/AuthService.jsx';

function Register() {  
  useEffect(() => {
    document.title = "Đăng ký - EasyTalk";
  }, []);

  const handleRegister = async (username, email, password, confirmPassword) => {
    const response = await AuthService.register(username, email, password, confirmPassword);
    if (response.success) {
      toast.success(response.message);
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } else {
      toast.error(response.message);
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
    </div>
  );
}

export default Register;