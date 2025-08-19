import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Menu() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('User');

  useEffect(() => {
    // Simulate checking for authentication token
    // Note: In Claude.ai artifacts, localStorage is not available
    // This is a mock implementation for demonstration
    const mockToken = false; // Set to true to simulate logged in state
    
    if (mockToken) {
      setUsername('John Doe');
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    if (window.confirm('Bạn có muốn đăng xuất tài khoản không?')) {
      setIsLoggedIn(false);
      setUsername('User');
      // In a real app: localStorage.removeItem('token');
      // window.location.href = '/login';
    }
  };

  return (
    <header className="main_menu">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <nav className="navbar navbar-expand-lg navbar-light">
              <Link className="navbar-brand" to="/">
                <img src="/src/assets/images/logo.png" alt="logo" width="75" />
              </Link>
              <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbarSupportedContent"
                aria-controls="navbarSupportedContent"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>

              <div
                className="collapse navbar-collapse main-menu-item"
                id="navbarSupportedContent"
              >
                <ul className="navbar-nav">
                  <li className="nav-item active">
                    <Link className="nav-link" to="/">
                      TRANG CHỦ
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/about">
                      VỀ CHÚNG TÔI
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/journey">
                      HÀNH TRÌNH
                    </Link>
                  </li>
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      id="navbarDropdownLessons"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      BÀI HỌC
                    </a>
                    <div className="dropdown-menu" aria-labelledby="navbarDropdownLessons">
                      <Link className="dropdown-item" to="/story">
                        CÂU CHUYỆN
                      </Link>
                      <Link className="dropdown-item" to="/grammar">
                        NGỮ PHÁP
                      </Link>
                      <Link className="dropdown-item" to="/flashcards">
                        TỪ VỰNG FLASHCARD
                      </Link>
                      <Link className="dropdown-item" to="/pronunciation">
                        PHÁT ÂM
                      </Link>
                    </div>
                  </li>
                  <li className="nav-item dropdown">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      id="navbarDropdownPractice"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      LUYỆN TẬP
                    </a>
                    <div className="dropdown-menu" aria-labelledby="navbarDropdownPractice">
                      <Link className="dropdown-item" to="/grammar-exercise">
                        NGỮ PHÁP
                      </Link>
                      <Link className="dropdown-item" to="/vocabulary-exercise">
                        TỪ VỰNG
                      </Link>
                      <Link className="dropdown-item" to="/pronunciation-exercise">
                        PHÁT ÂM
                      </Link>
                      <Link className="dropdown-item" to="/dictation-exercise">
                        NGHE CHÉP CHÍNH TẢ
                      </Link>
                      <Link className="dropdown-item" to="/dictionary">
                        TRA CỨU TỪ ĐIỂN
                      </Link>
                      <Link className="dropdown-item" to="/chat">
                        TRÒ CHUYỆN VỚI AI
                      </Link>
                      <Link className="dropdown-item" to="/communicate">
                        GIAO TIẾP VỚI AI
                      </Link>
                      <Link className="dropdown-item" to="/writing">
                        LUYỆN VIẾT VỚI AI
                      </Link>
                    </div>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/blog">
                      BÀI VIẾT
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/contact">
                      LIÊN HỆ
                    </Link>
                  </li>
                  <li className="nav-item dropdown">
                    <a
                      className="btn_1"
                      href={isLoggedIn ? '#' : '/login'}
                      id="loginBtn"
                      role="button"
                      data-bs-toggle={isLoggedIn ? 'dropdown' : ''}
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      {isLoggedIn ? username : 'ĐĂNG NHẬP'}
                    </a>
                    {isLoggedIn && (
                      <div className="dropdown-menu" aria-labelledby="loginBtn">
                        <Link className="dropdown-item" to="/profile">
                          THÔNG TIN CÁ NHÂN
                        </Link>
                        <Link className="dropdown-item" to="/reminder">
                          NHẮC NHỞ HỌC TẬP
                        </Link>
                        <Link className="dropdown-item" to="/change-password">
                          ĐỔI MẬT KHẨU
                        </Link>
                        <Link className="dropdown-item" to="/setting">
                          CÀI ĐẶT
                        </Link>
                        <a className="dropdown-item" href="#" onClick={handleLogout}>
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