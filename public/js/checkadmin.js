(function() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "/";
    } else {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'admin') {
            window.location.href = "/";
        }
    }
})();