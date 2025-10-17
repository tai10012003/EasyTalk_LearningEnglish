import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Swal from "sweetalert2";

const PrivateRoute = ({ children, roles = [] }) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const [redirectTo, setRedirectTo] = useState(null);

    useEffect(() => {
        if (!token) {
            Swal.fire({
                icon: 'warning',
                title: 'Cảnh báo',
                text: 'Bạn cần đăng nhập để truy cập trang này!',
                confirmButtonText: 'Đồng ý',
            }).then(() => {
                setRedirectTo("/login");
            });
        } else if (roles.length > 0 && !roles.includes(role)) {
            setRedirectTo("/");
        }
    }, [token, role, roles]);
    if (!token || (roles.length > 0 && !roles.includes(role))) {
        return redirectTo ? <Navigate to={redirectTo} replace /> : null;
    }
    return children;
};

export default PrivateRoute;