function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect("/login");
  }
  
  function isAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user.role === 'admin') {
      return next(); // Nếu người dùng là admin, tiếp tục đến route tiếp theo
    }
    res.redirect('/'); // Nếu không phải admin, điều hướng về trang đăng nhập
  }
  
  module.exports = { isAuthenticated, isAdmin };
  