import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

function Menu() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('User');
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState({
    lessons: false,
    practice: false,
    login: false,
  });

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
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.username) {
        setIsLoggedIn(true);
        setUsername(decoded.username);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Bạn có muốn đăng xuất tài khoản không?')) {
      localStorage.removeItem("token");
      setIsLoggedIn(false);
      setUsername('User');
      window.location.href = "/";
    }
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
    <header className={`main_menu ${scrolled ? "scrolled" : ""}`}>
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <nav className="navbar">
              <Link className="navbar-brand" to="/" onClick={handleLinkClick}>
                <img src="/src/assets/images/logo.png" alt="logo" width="75" />
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
                      <NavLink
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        to="/dictionary"
                        onClick={handleLinkClick}
                      >
                        <i className="fas fa-bookmark me-2"></i>TRA CỨU TỪ ĐIỂN
                      </NavLink>
                      <NavLink
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        to="/chat"
                        onClick={handleLinkClick}
                      >
                        <i className="fas fa-comments me-2"></i>TRÒ CHUYỆN VỚI AI
                      </NavLink>
                      <NavLink
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        to="/communicate"
                        onClick={handleLinkClick}
                      >
                        <i className="fas fa-user-group me-2"></i>GIAO TIẾP VỚI AI
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
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/change-password"
                          onClick={handleLinkClick}
                        >
                          <i className="fas fa-key me-2"></i>ĐỔI MẬT KHẨU
                        </NavLink>
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
                          onClick={() => {
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
  );
}

export default Menu;