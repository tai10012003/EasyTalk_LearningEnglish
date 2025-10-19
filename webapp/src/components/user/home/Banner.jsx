import React, { useState, useEffect } from 'react';
import banner from "@/assets/images/banner.png";

function Banner() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
                  Khám phá thế giới tiếng Anh cùng chúng tôi
                </h5>
                <h3 className="text-4xl font-bold mb-4">
                  CẢI THIỆN KỸ NĂNG TIẾNG ANH CỦA BẠN
                </h3>
                <p className="text-gray-700 mb-4">
                  {isLoggedIn
                    ? "Cho dù bạn là người mới bắt đầu hay muốn cải thiện kỹ năng của mình, hành trình của chúng tôi được thiết kế cho mọi trình độ và sẽ giúp bạn tự tin sử dụng tiếng Anh hàng ngày. Hãy bắt đầu trải nghiệm các tính năng học tiếng Anh của chúng tôi !!"
                    : "Cho dù bạn là người mới bắt đầu hay muốn cải thiện kỹ năng của mình, hành trình của chúng tôi được thiết kế cho mọi trình độ và sẽ giúp bạn tự tin sử dụng tiếng Anh hàng ngày. Hãy bắt đầu đăng nhập tài khoản của bạn và trải nghiệm nhé !!"
                  }
                </p>
                {!isLoggedIn && (
                  <a 
                    href="/login" 
                    className="btn_1 inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <i className="fas fa-play me-2"></i>BẮT ĐẦU NÀO !!
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