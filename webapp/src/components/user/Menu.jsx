import React, { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';

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

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Bạn có muốn đăng xuất tài khoản không?')) {
      setIsLoggedIn(false);
      setUsername('User');
      // In a real app: localStorage.removeItem('token');
      // window.location.href = '/login';
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
                      className="nav-link"
                      to="/"
                      exact
                      onClick={handleLinkClick}
                    >
                      TRANG CHỦ
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to="/about"
                      onClick={handleLinkClick}
                    >
                      VỀ CHÚNG TÔI
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to="/journey"
                      onClick={handleLinkClick}
                    >
                      HÀNH TRÌNH
                    </NavLink>
                  </li>
                  <li className={`nav-item dropdown ${dropdownOpen.lessons ? 'show' : ''}`}>
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      onClick={() => toggleDropdown('lessons')}
                      role="button"
                      aria-expanded={dropdownOpen.lessons}
                    >
                      BÀI HỌC
                    </a>
                    <div
                      className={`dropdown-menu ${dropdownOpen.lessons ? 'show' : ''}`}
                      aria-labelledby="navbarDropdownLessons"
                    >
                      <NavLink
                        className="dropdown-item"
                        to="/story"
                        onClick={handleLinkClick}
                      >
                        CÂU CHUYỆN
                      </NavLink>
                      <NavLink
                        className="dropdown-item"
                        to="/grammar"
                        onClick={handleLinkClick}
                      >
                        NGỮ PHÁP
                      </NavLink>
                      <NavLink
                        className="dropdown-item"
                        to="/flashcards"
                        onClick={handleLinkClick}
                      >
                        TỪ VỰNG FLASHCARD
                      </NavLink>
                      <NavLink
                        className="dropdown-item"
                        to="/pronunciation"
                        onClick={handleLinkClick}
                      >
                        PHÁT ÂM
                      </NavLink>
                    </div>
                  </li>
                  <li className={`nav-item dropdown ${dropdownOpen.practice ? 'show' : ''}`}>
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      onClick={() => toggleDropdown('practice')}
                      role="button"
                      aria-expanded={dropdownOpen.practice}
                    >
                      LUYỆN TẬP
                    </a>
                    <div
                      className={`dropdown-menu ${dropdownOpen.practice ? 'show' : ''}`}
                      aria-labelledby="navbarDropdownPractice"
                    >
                      <NavLink
                        className="dropdown-item"
                        to="/grammar-exercise"
                        onClick={handleLinkClick}
                      >
                        NGỮ PHÁP
                      </NavLink>
                      <NavLink
                        className="dropdown-item"
                        to="/vocabulary-exercise"
                        onClick={handleLinkClick}
                      >
                        TỪ VỰNG
                      </NavLink>
                      <NavLink
                        className="dropdown-item"
                        to="/pronunciation-exercise"
                        onClick={handleLinkClick}
                      >
                        PHÁT ÂM
                      </NavLink>
                      <NavLink
                        className="dropdown-item"
                        to="/dictation-exercise"
                        onClick={handleLinkClick}
                      >
                        NGHE CHÉP CHÍNH TẢ
                      </NavLink>
                      <NavLink
                        className="dropdown-item"
                        to="/dictionary"
                        onClick={handleLinkClick}
                      >
                        TRA CỨU TỪ ĐIỂN
                      </NavLink>
                      <NavLink
                        className="dropdown-item"
                        to="/chat"
                        onClick={handleLinkClick}
                      >
                        TRÒ CHUYỆN VỚI AI
                      </NavLink>
                      <NavLink
                        className="dropdown-item"
                        to="/communicate"
                        onClick={handleLinkClick}
                      >
                        GIAO TIẾP VỚI AI
                      </NavLink>
                      <NavLink
                        className="dropdown-item"
                        to="/writing"
                        onClick={handleLinkClick}
                      >
                        LUYỆN VIẾT VỚI AI
                      </NavLink>
                    </div>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to="/blog"
                      onClick={handleLinkClick}
                    >
                      BÀI VIẾT
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className="nav-link"
                      to="/contact"
                      onClick={handleLinkClick}
                    >
                      LIÊN HỆ
                    </NavLink>
                  </li>
                  <li className={`nav-item dropdown ${dropdownOpen.login ? 'show' : ''}`}>
                    <a
                      className="btn_1"
                      href={isLoggedIn ? '#' : '/login'}
                      onClick={() => isLoggedIn && toggleDropdown('login')}
                      role="button"
                      aria-expanded={dropdownOpen.login}
                    >
                      {isLoggedIn ? username : 'ĐĂNG NHẬP'}
                    </a>
                    {isLoggedIn && (
                      <div
                        className={`dropdown-menu ${dropdownOpen.login ? 'show' : ''}`}
                        aria-labelledby="loginBtn"
                      >
                        <NavLink
                          className="dropdown-item"
                          to="/profile"
                          onClick={handleLinkClick}
                        >
                          THÔNG TIN CÁ NHÂN
                        </NavLink>
                        <NavLink
                          className="dropdown-item"
                          to="/reminder"
                          onClick={handleLinkClick}
                        >
                          NHẮC NHỞ HỌC TẬP
                        </NavLink>
                        <NavLink
                          className="dropdown-item"
                          to="/change-password"
                          onClick={handleLinkClick}
                        >
                          ĐỔI MẬT KHẨU
                        </NavLink>
                        <NavLink
                          className="dropdown-item"
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