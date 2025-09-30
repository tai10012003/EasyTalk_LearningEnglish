import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
    const notifications = [
        "Người dùng mới đăng ký",
        "Bài học mới được thêm",
        "Người dùng hoàn thành chặng học",
        "Flashcard cập nhật"
    ];

    const handleLogout = () => {
        if (window.confirm('Bạn có muốn đăng xuất tài khoản không?')) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        }
    };

    return (
        <nav className="admin-navbar">
            <div className="admin-navbar-left">
                <marquee behavior="scroll" direction="right">
                    Chào mừng đến với trang quản trị viên EasyTalk!
                </marquee>
            </div>
            <div className="admin-navbar-right">
                <div className="admin-notifications">
                    <i className="fas fa-bell"></i>
                    <span className="admin-notification-count">{notifications.length}</span>
                    <div className="admin-notification-dropdown">
                        {notifications.map((note, idx) => (
                            <div key={idx} className="admin-notification-item">{note}</div>
                        ))}
                    </div>
                </div>
                <div className="admin-profile">
                    <i className="fas fa-user-circle"></i> Admin
                    <div className="admin-profile-dropdown">
                        <Link to="/admin/profile" className="admin-profile-item">
                            <i className="fas fa-info-circle"></i> Xem thông tin
                        </Link>
                        <button onClick={handleLogout} className="admin-profile-item">
                            <i className="fas fa-sign-out-alt"></i> Đăng xuất
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;