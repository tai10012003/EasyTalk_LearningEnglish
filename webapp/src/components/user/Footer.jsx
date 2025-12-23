import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import logo from "@/assets/images/logo.png"
import Swal from "sweetalert2";

function Footer() {
  const { t } = useTranslation();
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
                {t("footer.description")}
              </p>
            </div>
          </div>
          <div className="col-sm-6 col-md-4">
            <div className="single-footer-widget footer_2">
              <h4>{t("footer.send_email")}</h4>
              <p>{t("footer.email_desc")}</p>
              <form onSubmit={handleEmailSubmit}>
                <div className="input-group">
                  <input
                    type="email"
                    className="form-control"
                    placeholder={t("footer.email_input")}
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
              <h4>{t("footer.contact_us")}</h4>
              <div className="contact_info">
                <p><span>{t("footer.address")}:</span>2 Đ. Hải Triều, Bến Nghé, Quận 1, Hồ Chí Minh</p>
                <p><span>{t("footer.phone")}:</span>0927749820</p>
                <p><span>{t("footer.email")}:</span>pductai14@gmail.com</p>
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
                &copy; {new Date().getFullYear()} {t("footer.copyright")} {' '}
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