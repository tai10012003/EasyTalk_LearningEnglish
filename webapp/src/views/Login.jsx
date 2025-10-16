import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoginForm from '@/components/user/auth/LoginForm.jsx';
import Mascot from '@/components/user/auth/Mascot.jsx';
import SocialLoginButtons from '@/components/user/auth/SocialLoginButtons.jsx';
import { AuthService } from '@/services/AuthService.jsx';

function Login() {
  useEffect(() => {
    document.title = "Đăng nhập - EasyTalk";
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");
    const role = query.get("role");
    const error = query.get("error");
    const provider = query.get("provider");
    if (error) {
      const providerName = provider == "facebook" ? "Facebook" : "Google";
      toast.error(`Đăng nhập ${providerName} thất bại: ${error}`);
      setTimeout(() => (window.location.href = "/login"), 2000);
      return;
    }
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      const providerName = provider == "facebook" ? "Facebook" : "Google";
      toast.success(`Đăng nhập ${providerName} thành công!`);
      setTimeout(() => {
        window.location.href = role == "admin" ? "/admin/dashboard" : "/";
      }, 1500);
    }
  }, []);

  const handleLogin = async (email, password) => {
    try {
      const data = await AuthService.login(email, password);
      // console.log("Login response:", data);
      // console.log("Token nhận được:", data.token);
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      toast.success("Đăng nhập thành công !!");
      setTimeout(() => {
        window.location.href = data.role == "admin" ? "/admin/dashboard" : "/";
      }, 1500);
    } catch (error) {
      toast.error(error.message);
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
                <ToastContainer position="top-center" autoClose={2000} theme="colored" />
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