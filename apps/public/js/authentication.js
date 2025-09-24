// Kiểm tra token ngay khi trang được tải
(function() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("Bạn cần đăng nhập để truy cập trang này.");
        window.location.href = "/login";
    }
})();