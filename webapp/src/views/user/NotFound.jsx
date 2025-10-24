import { useEffect } from "react";
import { Link } from "react-router-dom";

function NotFound() {
  useEffect(() => {
    document.title = "404 - EasyTalk";
  }, []);
  
  return (
    <div className="notfound-container">
      <h1 className="notfound-title">404</h1>
      <h2 className="notfound-subtitle">Rất tiếc! Không tìm thấy trang</h2>
      <p className="notfound-text">
        Trang bạn đang tìm kiếm có thể đã bị xóa, đổi tên hoặc tạm thời không truy cập được.
      </p>
      <Link to="/" className="notfound-button">
        Quay lại trang chủ
      </Link>
    </div>
  );
}

export default NotFound;
