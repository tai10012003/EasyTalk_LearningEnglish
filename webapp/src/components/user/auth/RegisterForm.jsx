import React, { useState } from 'react';

function RegisterForm({ onSubmit }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(username, email, password, confirmPassword);
  };

  return (
    <form onSubmit={handleSubmit}>
        <div className="auth-form-group">
            <label htmlFor="username">Tên của bạn: </label>
            <input
            type="text"
            className="auth-input"
            id="username"
            name="username"
            placeholder="Nhập tên của bạn (tối đa 10 ký tự)"
            maxLength="10"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            />
        </div>

        <div className="auth-form-group">
            <label htmlFor="email">Email: </label>
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
            <label htmlFor="password">Mật khẩu: </label>
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
            <label htmlFor="confirmPassword">Xác nhận mật khẩu: </label>
            <input
            type="password"
            className="auth-input"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            />
        </div>

        <button type="submit" className="auth-btn">Đăng ký</button>
    </form>
  );
}

export default RegisterForm;