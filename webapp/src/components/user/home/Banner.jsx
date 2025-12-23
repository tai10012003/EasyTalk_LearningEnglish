import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import banner from "@/assets/images/banner.png";

function Banner() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { t, i18n } = useTranslation();
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");
      setIsLoggedIn(!!(token && refreshToken));
    };
    checkLoginStatus();
    const handleStorageChange = (e) => {
      if (e.key == 'token' || e.key == 'refreshToken') {
        checkLoginStatus();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  return (
    <section className="banner_part bg-gray-100 py-16">
      <div className="container mx-auto">
        <div className="row flex items-center">
          <div className="col-lg-6 col-xl-6">
            <div className="banner_text">
              <div className="banner_text_iner p-5">
                <h5 className="text-lg font-semibold text-gray-600">
                  {t("home.banner.explore")}
                </h5>
                <h3 className="text-4xl font-bold mb-4">
                  {t("home.banner.title")}
                </h3>
                <p className="text-gray-700 mb-4">
                  {isLoggedIn
                    ? t("home.banner.description_loggedIn")
                    : t("home.banner.description")
                  }
                </p>
                {!isLoggedIn && (
                  <a 
                    href="/login" 
                    className="btn_1 inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <i className="fas fa-play me-2"></i>{t("home.banner.start")}
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="col-lg-6 col-xl-6">
            <div className="banner_image flex justify-center items-center h-full">
              <img 
                src={banner} 
                alt="Banner Image" 
                className="max-w-full max-h-64 rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Banner;