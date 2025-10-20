import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from "@/assets/images/logo.png"
import Swal from "sweetalert2";

function Footer() {
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      Swal.fire({
        icon: "success",
        title: "Đăng ký thành công",
        text: "Cảm ơn bạn đã đăng ký! Chúng tôi sẽ liên hệ sớm.",
      });
      setEmail('');
    }
  };

  return (
    <footer className="footer-area">
      <div className="container">
        <div className="row">
          <div className="col-sm-6 col-md-4">
            <div className="single-footer-widget footer_1">
              <Link to="/">
                <img src={logo} alt="logo" width="120" />
              </Link>
              <p>
                Khi tham gia EasyTalk, người dùng sẽ có trải nghiệm giao tiếp liền mạch. Cho dù đang học hay đang thực hành, nền tảng này sẽ hướng dẫn người học dễ dàng qua từng giai đoạn, đảm bảo tiến trình suôn sẻ và cải thiện đáng kể.
              </p>
            </div>
          </div>
          <div className="col-sm-6 col-md-4">
            <div className="single-footer-widget footer_2">
              <h4>Gửi Thư</h4>
              <p>Bạn có thắc mắc hay khó khăn gì thì gửi về cho chúng tôi.</p>
              <form onSubmit={handleEmailSubmit}>
                <div className="input-group">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Nhập email của bạn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <button className="btn" type="submit">
                    <i className="ti-angle-right"></i>
                  </button>
                </div>
              </form>
              <div className="social_icon">
                <a href="#" aria-label="Facebook">
                  <i className="ti-facebook"></i>
                </a>
                <a href="#" aria-label="Twitter">
                  <i className="ti-twitter-alt"></i>
                </a>
                <a href="#" aria-label="Instagram">
                  <i className="ti-instagram"></i>
                </a>
                <a href="#" aria-label="Skype">
                  <i className="ti-skype"></i>
                </a>
              </div>
            </div>
          </div>
          <div className="col-sm-6 col-md-4">
            <div className="single-footer-widget footer_2">
              <h4>Liên Hệ Chúng Tôi</h4>
              <div className="contact_info">
                <p><span>Địa chỉ:</span>2 Đ. Hải Triều, Bến Nghé, Quận 1, Hồ Chí Minh</p>
                <p><span>Số điện thoại:</span>0927749820</p>
                <p><span>Email:</span>pductai14@gmail.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="copyright_part_text">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <p className="footer-text">
                &copy; {new Date().getFullYear()} Mọi quyền được bảo lưu | Mẫu này được tạo bởi{' '}
                <i className="ti-heart" aria-hidden="true"></i>{' '}
                <a href="https://www.facebook.com/phamduc.tai.2002/" target="_blank" rel="noopener noreferrer">
                  Duc Tai
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;