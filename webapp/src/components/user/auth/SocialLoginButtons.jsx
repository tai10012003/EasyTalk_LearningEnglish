import React from 'react';

function SocialLoginButtons() {
  return (
    <div className="auth-social-auth-buttons">
        <a href="/auth/google" className="auth-google">Đăng nhập Google</a>
        <a href="#" className="auth-facebook">Đăng nhập Facebook</a>
    </div>
  );
}

export default SocialLoginButtons;