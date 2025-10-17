import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";

const PrivateRoute = ({ children, roles = [] }) => {
    const token = localStorage.getItem("token");
    const [hasAlertShown, setHasAlertShown] = useState(false);
    const role = localStorage.getItem("role");

    if (!token || !roles) {
        if (!hasAlertShown) {
            Swal.fire({
                icon: "warning",
                title: "Cảnh báo",
                text: "Bạn cần đăng nhập để truy cập trang này!",
                confirmButtonText: "Đồng ý",
            });
            setHasAlertShown(true);
        }
        return <Navigate to="/login" replace />;
    }
    if (roles.length > 0 && !roles.includes(role)) {
        if (!hasAlertShown) {
            setHasAlertShown(true);
        }
        return <Navigate to="/" replace />;
    }
    return children;
};

export default PrivateRoute;