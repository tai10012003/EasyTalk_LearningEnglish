import React, { useState } from 'react';

function LoginForm({ onSubmit }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(email, password);
  };

  return (
    <form id="loginForm" onSubmit={handleSubmit}>
        <div className="auth-form-group">
            <label htmlFor="email">Email:</label>
            <input
            type="email"
            className="auth-input"
            id="email"
            name="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            />
        </div>
        <div className="auth-form-group">
            <label htmlFor="password">Mật khẩu:</label>
            <input
            type="password"
            className="auth-input"
            id="password"
            name="password"
            placeholder="Nhập mật khẩu của bạn"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            />
        </div>
        <div className="auth-form-group">
            <a href="/forgot-password" className="auth-forgot-password">
            Quên mật khẩu?
            </a>
        </div>
        <button type="submit" className="auth-btn">
            Đăng nhập
        </button>
    </form>
  );
}

export default LoginForm;