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
  const isLessonsActive = lessonRoutes.some((p) => location.pathname === p);
  const isPracticeActive = practiceRoutes.some((p) => location.pathname === p);
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
                      TRANG CHỦ
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      to="/about"
                      onClick={handleLinkClick}
                    >
                      VỀ CHÚNG TÔI
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      to="/journey"
                      onClick={handleLinkClick}
                    >
                      HÀNH TRÌNH
                    </NavLink>
                  </li>
                  <li className={`nav-item dropdown ${showLessons ? 'show' : ''}`}>
                    <a
                      className={`nav-link dropdown-toggle ${isLessonsActive ? 'active' : ''}`}
                      onClick={() => toggleDropdown('lessons')}
                      role="button"
                      aria-expanded={showLessons}
                    >
                      BÀI HỌC
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
                        CÂU CHUYỆN
                      </NavLink>
                      <NavLink
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        to="/grammar"
                        onClick={handleLinkClick}
                      >
                        NGỮ PHÁP
                      </NavLink>
                      <NavLink
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        to="/flashcards"
                        onClick={handleLinkClick}
                      >
                        TỪ VỰNG FLASHCARD
                      </NavLink>
                      <NavLink
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        to="/pronunciation"
                        onClick={handleLinkClick}
                      >
                        PHÁT ÂM
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
                      LUYỆN TẬP
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
                        NGỮ PHÁP
                      </NavLink>
                      <NavLink
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        to="/vocabulary-exercise"
                        onClick={handleLinkClick}
                      >
                        TỪ VỰNG
                      </NavLink>
                      <NavLink
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        to="/pronunciation-exercise"
                        onClick={handleLinkClick}
                      >
                        PHÁT ÂM
                      </NavLink>
                      <NavLink
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        to="/dictation-exercise"
                        onClick={handleLinkClick}
                      >
                        NGHE CHÉP CHÍNH TẢ
                      </NavLink>
                      <NavLink
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        to="/dictionary"
                        onClick={handleLinkClick}
                      >
                        TRA CỨU TỪ ĐIỂN
                      </NavLink>
                      <NavLink
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        to="/chat"
                        onClick={handleLinkClick}
                      >
                        TRÒ CHUYỆN VỚI AI
                      </NavLink>
                      <NavLink
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        to="/communicate"
                        onClick={handleLinkClick}
                      >
                        GIAO TIẾP VỚI AI
                      </NavLink>
                      <NavLink
                        className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                        to="/writing"
                        onClick={handleLinkClick}
                      >
                        LUYỆN VIẾT VỚI AI
                      </NavLink>
                    </div>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      to="/blog"
                      onClick={handleLinkClick}
                    >
                      BÀI VIẾT
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      to="/contact"
                      onClick={handleLinkClick}
                    >
                      LIÊN HỆ
                    </NavLink>
                  </li>
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
                      {isLoggedIn ? username : "Đăng nhập"}
                    </a>
                    {isLoggedIn && (
                      <div
                        className={`dropdown-menu ${dropdownOpen.login ? 'show' : ''}`}
                        aria-labelledby="loginBtn"
                      >
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/profile"
                          onClick={handleLinkClick}
                        >
                          THÔNG TIN CÁ NHÂN
                        </NavLink>
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/reminder"
                          onClick={handleLinkClick}
                        >
                          NHẮC NHỞ HỌC TẬP
                        </NavLink>
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/change-password"
                          onClick={handleLinkClick}
                        >
                          ĐỔI MẬT KHẨU
                        </NavLink>
                        <NavLink
                          className={({ isActive }) => `dropdown-item ${isActive ? 'active' : ''}`}
                          to="/setting"
                          onClick={handleLinkClick}
                        >
                          CÀI ĐẶT
                        </NavLink>
                        <a
                          className="dropdown-item"
                          href="#"
                          onClick={() => {
                            handleLogout();
                            handleLinkClick();
                          }}
                        >
                          ĐĂNG XUẤT
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