import React from "react";
import logo from "/src/assets/images/logo.png";

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <img src={logo} alt="Logo" className="loading-logo" />
      <div className="spinner"></div>
      <h2>Đang tải...</h2>
    </div>
  );
}

export default LoadingScreen;