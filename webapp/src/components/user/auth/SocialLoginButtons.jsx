import React from 'react';
const API_URL = import.meta.env.VITE_API_URL;

function SocialLoginButtons() {
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };
  const handleFacebookLogin = () => {
    window.location.href = `${API_URL}/auth/facebook`;
  };
  return (
    <div className="auth-social-auth-buttons">
      <a
        className="auth-google"
        onClick={handleGoogleLogin}
        style={{ cursor: "pointer" }}
      >
        <i className="fab fa-google me-2"></i> Đăng nhập với Google
      </a>
      <a
        className="auth-facebook"
        onClick={handleFacebookLogin}
        style={{ cursor: "pointer" }}
      >
        <i className="fab fa-facebook me-2"></i> Đăng nhập Facebook
      </a>
    </div>
  );
}

export default SocialLoginButtons;