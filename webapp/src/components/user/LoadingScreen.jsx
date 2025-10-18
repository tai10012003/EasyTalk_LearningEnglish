import React from "react";

const LoadingScreen = () => {
  return (
    <div className="global-spinner-overlay">
      <div className="global-spinner-content">
        <div className="global-spinner-loader"></div>
        <p className="global-spinner-text">Loading....</p>
      </div>
    </div>
  );
};

export default LoadingScreen;