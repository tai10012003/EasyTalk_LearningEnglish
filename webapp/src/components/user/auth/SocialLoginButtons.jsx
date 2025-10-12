import React from 'react';
const API_URL = import.meta.env.VITE_API_URL;

function SocialLoginButtons() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };
  return (
    <div className="auth-social-auth-buttons">
      <a
        className="auth-google"
        onClick={handleGoogleLogin}
      >
        <i className="fab fa-google me-2"></i> Đăng nhập với Google
      </a>
      <a
        href="#"
        className="auth-facebook"
      >
        <i className="fab fa-facebook me-2"></i> Đăng nhập Facebook
      </a>
    </div>
  );
}

export default SocialLoginButtons;