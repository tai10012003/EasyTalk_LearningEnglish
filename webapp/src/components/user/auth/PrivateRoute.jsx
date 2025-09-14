import React, { useState } from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
    const token = localStorage.getItem("token");
    const [hasAlertShown, setHasAlertShown] = useState(false);
    if (!token) {
        if (!hasAlertShown) {
            window.alert("Bạn cần đăng nhập để truy cập trang này.");
            setHasAlertShown(true);
        }
        return <Navigate to="/login" replace />;
    }
    return children;
};

export default PrivateRoute;