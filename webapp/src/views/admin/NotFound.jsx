import { useEffect } from "react";
import { Link } from "react-router-dom";

function NotFound() {
    useEffect(() => {
        document.title = "404 - Admin Panel | EasyTalk";
    }, []);

    return (
        <div className="admin-notfound-container">
            <div className="admin-notfound-card">
                <h1 className="admin-notfound-title">404</h1>
                <h2 className="admin-notfound-subtitle">Trang quản trị không tồn tại</h2>
                <p className="admin-notfound-text">
                    Liên kết bạn truy cập không khả dụng trong hệ thống quản trị.
                </p>
                <Link to="/admin/dashboard" className="admin-notfound-button">
                    <i className="fas fa-arrow-left"></i> Quay lại Dashboard
                </Link>
            </div>
        </div>
    );
}

export default NotFound;