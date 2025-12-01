import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '@/services/AuthService.jsx';
import Swal from 'sweetalert2';

const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

const isTokenExpired = (token) => {
    const decoded = parseJwt(token);
    if (!decoded || !decoded.exp) return true;
    return decoded.exp * 1000 < Date.now();
};

function Navbar() {
    const [username, setUsername] = useState("Admin");
    useEffect(() => {
        const checkAndRefreshToken = async () => {
          const token = localStorage.getItem("token");
          const refreshToken = localStorage.getItem("refreshToken");
          if (token && refreshToken) {
            if (isTokenExpired(token)) {
              try {
                await AuthService.refreshToken();
                console.log("✅ Token đã được refresh khi load menu");
              } catch (error) {
                console.error("❌ Không thể refresh token:", error);
                handleLogoutSilent();
                return;
              }
            }
            const currentToken = localStorage.getItem("token");
            const decoded = parseJwt(currentToken);
            if (decoded && decoded.username) {
              setUsername(decoded.username);
              AuthService.startTokenRefreshTimer();
            }
          }
        };
        checkAndRefreshToken();
    }, []);

    const handleLogoutSilent = async () => {
        await AuthService.logout();
    };

    const notifications = [
        "Người dùng mới đăng ký",
        "Bài học mới được thêm",
        "Người dùng hoàn thành chặng học",
        "Flashcard cập nhật"
    ];

    const handleLogout = () => {
        Swal.fire({
            title: 'Bạn có chắc?',
            text: "Bạn có muốn đăng xuất tài khoản không?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Đăng xuất',
            cancelButtonText: 'Hủy',
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Đã đăng xuất!',
                    text: 'Bạn đã đăng xuất thành công.',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                   AuthService.logout();
                });
            }
        });
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
                    <i className="fas fa-user-circle"></i> {username}
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