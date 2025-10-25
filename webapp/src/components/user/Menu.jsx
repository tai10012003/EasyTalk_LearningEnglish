import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { io } from "socket.io-client";
import { UserProgressService } from '@/services/UserProgressService.jsx';
import { AuthService } from '@/services/AuthService.jsx';
import { NotificationService } from '@/services/NotificationService.jsx';
import logo from '@/assets/images/logo.png';

const API_URL = import.meta.env.VITE_API_URL;

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

function Menu() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('User');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    lessons: false,
    practice: false,
    login: false,
  });
  const [streakData, setStreakData] = useState({ streak: 0 });
  const [leaderData, setLeaderData] = useState({ experiencePoints: 0 });
  const [notifications, setNotifications] = useState([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const location = useLocation();
  const lessonRoutes = ['/story', '/grammar', '/flashcards', '/pronunciation'];
  const practiceRoutes = [
    '/grammar-exercise',
    '/vocabulary-exercise',
    '/pronunciation-exercise',
    '/dictation-exercise',
    '/dictionary',
    '/chat',
    '/communicate',
    '/writing',
  ];
  const isLessonsActive = lessonRoutes.some((p) => location.pathname == p);
  const isPracticeActive = practiceRoutes.some((p) => location.pathname == p);
  const isMobile = window.innerWidth <= 991;
  const showLessons = isMobile ? dropdownOpen.lessons : (dropdownOpen.lessons || isLessonsActive);
  const showPractice = isMobile ? dropdownOpen.practice : (dropdownOpen.practice || isPracticeActive);

  useEffect(() => {
    if (!isLoggedIn) return;
    console.log("🔹 Initializing socket...");
    const newSocket = io(API_URL, { transports: ['websocket', 'polling'] });
    setSocket(newSocket);
    newSocket.on("connect", () => {
      const token = localStorage.getItem("token");
      const decoded = parseJwt(token);
      if (decoded && decoded.id) {
        newSocket.emit("register", decoded.id);
      }
    });
    newSocket.on("connect_error", (err) => console.error("❌ Socket connect error:", err));
    newSocket.on("disconnect", (reason) => console.log("⚠️ Socket disconnected:", reason));
    newSocket.on("new-notification", (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
    return () => {
      console.log("🔹 Disconnecting socket...");
      newSocket.disconnect();
      setSocket(null);
    };
  }, [isLoggedIn]);

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
          setIsLoggedIn(true);
          setUsername(decoded.username);
          AuthService.startTokenRefreshTimer();
          fetchUserData();
          fetchNotifications();
        }
      }
    };
    checkAndRefreshToken();
  }, []);

  const fetchUserData = () => {
    UserProgressService.getUserStreak()
      .then((data) => {
        setStreakData({
          streak: data.streak || 0,
        });
      })
      .catch((err) => console.error("Error fetching streak:", err));
    UserProgressService.getUserExperiencePoints()
      .then((data) => {
        setLeaderData({
          experiencePoints: data.experiencePoints || 0,
        });
      })
      .catch((err) => console.error("Error fetching experience points:", err));
  };

  const fetchNotifications = async () => {
    try {
      const data = await NotificationService.fetchUserNotifications();
      setNotifications(data);
      const unread = data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(notifications.map(n => n._id == notificationId ? { ...n, isRead: true } : n ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Đã đánh dấu tất cả thông báo là đã đọc.',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  const handleToggleReadStatus = async (notificationId, currentStatus) => {
    try {
      if (currentStatus) {
        await NotificationService.markAsUnread(notificationId);
        setNotifications(notifications.map(n =>
          n._id == notificationId ? { ...n, isRead: false } : n
        ));
        setUnreadCount(prev => prev + 1);
      } else {
        await NotificationService.markAsRead(notificationId);
        setNotifications(notifications.map(n =>
          n._id == notificationId ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Error toggling read status:", err);
    }
  };

  const formatTime = (dateString) => {
    const now = new Date();
    const notifTime = new Date(dateString);
    const diff = Math.floor((now - notifTime) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return notifTime.toLocaleDateString('vi-VN');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'promo': return '🎁';
      case 'system': return '⚙️';
      case 'update': return '🆕';
      default: return 'ℹ️';
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    Swal.fire({
      title: 'Xác nhận xóa?',
      text: 'Bạn có chắc muốn xóa thông báo này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await NotificationService.deleteNotification(notificationId);
          setNotifications(notifications.filter(n => n._id !== notificationId));
          setUnreadCount(notifications.filter(n => !n.isRead && n._id !== notificationId).length);
          Swal.fire({
            icon: 'success',
            title: 'Đã xóa!',
            text: 'Thông báo đã được xóa thành công.',
            timer: 1200,
            showConfirmButton: false
          });
        } catch (err) {
          console.error("Error deleting notification:", err);
          Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: 'Không thể xóa thông báo. Vui lòng thử lại.',
          });
        }
      }
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.notification-wrapper')) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
          showConfirmButton: false,
        }).then(() => {
          AuthService.logout();
        });
      }
    });
  };
  const handleLogoutSilent = async () => {
    await AuthService.logout();
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const toggleDropdown = (dropdown) => {
    setDropdownOpen((prev) => ({
      ...prev,
      [dropdown]: !prev[dropdown],
    }));
  };

  const handleLinkClick = () => {
    setMenuOpen(false);
    setDropdownOpen({ lessons: false, practice: false, login: false });
  };

  return (
    <>
      <div className="top-bar">
        <div className="container d-flex justify-content-between">
          <div className="top-bar-center">
            <div className="marquee">
              <span>
                Chào mừng bạn đến EasyTalk! – Cùng bạn chinh phục tiếng Anh mỗi ngày – Học dễ dàng, nói tự tin 🚀
              </span>
            </div>
          </div>
          {isLoggedIn && (
            <div className="top-bar-right d-flex align-items-center">
              <div className="xp me-4">
                ⭐ <strong>XP: {leaderData.experiencePoints}</strong>
              </div>
              <div className="streak me-4">
                <Link to="/streak" className="text-decoration-none text-dark" style={{ textDecoration: 'none' }}>
                  🔥 <strong>{streakData.streak} ngày</strong>
                </Link>
              </div>
              <div className="notification-wrapper">
                <button 
                  className="notification-bell-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotificationDropdown(!showNotificationDropdown);
                  }}
                >
                  <i className="fas fa-bell"></i>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>
                {showNotificationDropdown && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <h6>Thông báo của bạn</h6>
                      {unreadCount > 0 && (
                        <button 
                          className="mark-all-read-btn"
                          onClick={handleMarkAllAsRead}
                        >
                          Đánh dấu tất cả đã đọc
                        </button>
                      )}
                    </div>
                    <div className="notification-list">
                      {notifications.length == 0 ? (
                        <div className="no-notifications">
                          <i className="fas fa-bell-slash"></i>
                          <p>Không có thông báo nào</p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif._id}
                            className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                          >
                            <div
                              className="notif-main"
                              onClick={() => {
                                if (!notif.isRead) handleMarkAsRead(notif._id);
                                if (notif.link) window.open(notif.link, '_blank');
                              }}
                            >
                              <div className="notif-icon">{getNotificationIcon(notif.type)}</div>
                              <div className="notif-content">
                                <h6 className="notif-title">{notif.title}</h6>
                                <p>{notif.message}</p>
                                <span className="notif-time">{formatTime(notif.createdAt)}</span>
                              </div>

                              <div className="notif-actions">
                                {!notif.isRead && <span className="unread-dot"></span>}
                                <button
                                  className="toggle-read-btn"
                                  title={notif.isRead ? "Đánh dấu là chưa đọc" : "Đánh dấu là đã đọc"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleReadStatus(notif._id, notif.isRead);
                                  }}
                                >
                                  {notif.isRead ? (
                                    <i className="fas fa-envelope-open"></i>
                                  ) : (
                                    <i className="fas fa-envelope"></i>
                                  )}
                                </button>
                                <button
                                  className="delete-notif-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteNotification(notif._id);
                                  }}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <header className={`main_menu ${scrolled ? "scrolled" : ""}`}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <nav className="navbar">
                <Link className="navbar-brand" to="/" onClick={handleLinkClick}>
                  <img src={logo} alt="logo" width="75" />
                </Link>
                <button
                  className={`navbar-toggler ${menuOpen ? 'active' : ''}`}
                  type="button"
                  onClick={toggleMenu}
                  aria-label="Toggle navigation"
                >
                  <span className="navbar-toggler-icon"></span>
                  <span className="navbar-toggler-icon"></span>
                  <span className="navbar-toggler-icon"></span>
                </button>
                <div
                  className={`main-menu-item ${menuOpen ? 'show' : ''}`}
                  id="navbarSupportedContent"
                >
                  <ul className="navbar-nav">
                    <li className="nav-item">
                      <NavLink
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        to="/"
                        end
                        onClick={handleLinkClick}
                      >
                        <i className="fas fa-home me-2"></i>TRANG CHỦ
                      </NavLink>
                    </li>
                    {/* <li className="nav-item">
                      <NavLink
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        to="/about"
                        onClick={handleLinkClick}
                      >
                        VỀ CHÚNG TÔI
                      </NavLink>
                    </li> */}
                    <li className="nav-item">
                      <NavLink
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        to="/journey"
                        onClick={handleLinkClick}
                      >
                        <i className="fas fa-road me-2"></i>HÀNH TRÌNH
                      </NavLink>
                    </li>
                    <li className={`nav-item dropdown ${showLessons ? 'show' : ''}`}>
                      <a
                        className={`nav-link dropdown-toggle ${isLessonsActive ? 'active' : ''}`}
                        onClick={() => toggleDropdown('lessons')}
                        role="button"
                        aria-expanded={showLessons}
                      >
                        <i className="fas fa-book-open me-2"></i>BÀI HỌC
                      </a>
                      <div
                        className={`dropdown-menu ${showLessons ? 'show' : ''}`}
                        aria-labelledby="navbarDropdownLessons"
                      >
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/story"
                          onClick={handleLinkClick}
                        >
                          <i className="fas fa-book me-2"></i>CÂU CHUYỆN
                        </NavLink>
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/grammar"
                          onClick={handleLinkClick}
                        >
                          <i className="fas fa-language me-2"></i>NGỮ PHÁP
                        </NavLink>
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/flashcards"
                          onClick={handleLinkClick}
                        >
                          <i className="fas fa-clone me-2"></i>TỪ VỰNG FLASHCARD
                        </NavLink>
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/pronunciation"
                          onClick={handleLinkClick}
                        >
                          <i className="fas fa-microphone me-2"></i>PHÁT ÂM
                        </NavLink>
                      </div>
                    </li>
                    <li className={`nav-item dropdown ${showPractice ? 'show' : ''}`}>
                      <a
                        className={`nav-link dropdown-toggle ${isPracticeActive ? 'active' : ''}`}
                        onClick={() => toggleDropdown('practice')}
                        role="button"
                        aria-expanded={showPractice}
                      >
                        <i className="fas fa-dumbbell me-2"></i>LUYỆN TẬP
                      </a>
                      <div
                        className={`dropdown-menu ${showPractice ? 'show' : ''}`}
                        aria-labelledby="navbarDropdownPractice"
                      >
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/grammar-exercise"
                          onClick={handleLinkClick}
                        >
                          <i className="fas fa-pen me-2"></i>NGỮ PHÁP
                        </NavLink>
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/vocabulary-exercise"
                          onClick={handleLinkClick}
                        >
                          <i className="fas fa-spell-check me-2"></i>TỪ VỰNG
                        </NavLink>
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/pronunciation-exercise"
                          onClick={handleLinkClick}
                        >
                          <i className="fas fa-volume-up me-2"></i>PHÁT ÂM
                        </NavLink>
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/dictation-exercise"
                          onClick={handleLinkClick}
                        >
                          <i className="fas fa-headphones me-2"></i>NGHE CHÉP CHÍNH TẢ
                        </NavLink>
                        {/* <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/dictionary"
                          onClick={handleLinkClick}
                        >
                          <i className="fas fa-bookmark me-2"></i>TRA CỨU TỪ ĐIỂN
                        </NavLink> */}
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/chat"
                          onClick={handleLinkClick}
                        >
                          <i className="fas fa-comments me-2"></i>GIAO TIẾP VỚI AI
                        </NavLink>
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/reading"
                          onClick={handleLinkClick}
                        >
                          <i className="fas fas fa-book me-2"></i>LUYỆN ĐỌC
                        </NavLink>
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/writing"
                          onClick={handleLinkClick}
                        >
                          <i className="fas fa-keyboard me-2"></i>LUYỆN VIẾT VỚI AI
                        </NavLink>
                      </div>
                    </li>
                    {/* <li className="nav-item">
                      <NavLink
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        to="/blog"
                        onClick={handleLinkClick}
                      >
                        BÀI VIẾT
                      </NavLink>
                    </li> */}
                    <li className="nav-item">
                      <NavLink
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        to="/leaderboard"
                        onClick={handleLinkClick}
                      >
                        <i className="fas fa-trophy me-2"></i>BẢNG XẾP HẠNG
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        to="/statistic"
                        onClick={handleLinkClick}
                      >
                        <i className="fas fa-chart-line me-2"></i>THỐNG KÊ
                      </NavLink>
                    </li>
                    {/* <li className="nav-item">
                      <NavLink
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        to="/contact"
                        onClick={handleLinkClick}
                      >
                        LIÊN HỆ
                      </NavLink>
                    </li> */}
                    <li className={`nav-item dropdown ${dropdownOpen.login ? 'show' : ''}`}>
                      <a
                        className={isLoggedIn ? "btn_2" : "btn_1"}
                        href={isLoggedIn ? "#" : "/login"}
                        onClick={(e) => {
                          if (isLoggedIn) {
                            e.preventDefault();
                            toggleDropdown("login");
                          }
                        }}
                        role="button"
                        aria-expanded={dropdownOpen.login}
                      >
                        <i className="fas fa-user-circle me-2"></i>{isLoggedIn ? username : "Đăng nhập"}
                      </a>
                      {isLoggedIn && (
                        <div
                          className={`dropdown-menu ${dropdownOpen.login ? 'show' : ''}`}
                          aria-labelledby="loginBtn"
                        >
                          {/* <NavLink
                            className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                            to="/profile"
                            onClick={handleLinkClick}
                          >
                            THÔNG TIN CÁ NHÂN
                          </NavLink> */}
                          <NavLink
                            className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                            to="/reminder"
                            onClick={handleLinkClick}
                          >
                            <i className="fas fa-bell me-2"></i>NHẮC NHỞ HỌC TẬP
                          </NavLink>
                          {/* <NavLink
                            className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                            to="/change-password"
                            onClick={handleLinkClick}
                          >
                            <i className="fas fa-key me-2"></i>ĐỔI MẬT KHẨU
                          </NavLink> */}
                          <NavLink
                            className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                            to="/setting"
                            onClick={handleLinkClick}
                          >
                            <i className="fas fa-cog me-2"></i>CÀI ĐẶT
                          </NavLink>
                          <a
                            className="dropdown-item"
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handleLogout();
                              handleLinkClick();
                            }}
                          >
                            <i className="fas fa-sign-out-alt me-2"></i>ĐĂNG XUẤT
                          </a>
                        </div>
                      )}
                    </li>
                  </ul>
                </div>
              </nav>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Menu;