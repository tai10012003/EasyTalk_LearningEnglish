import React from "react";

function Footer() {
  return (
    <footer className="admin-footer">
        <div className="admin-footer-left">
            © {new Date().getFullYear()} <b>Admin Panel</b>. All rights reserved.
        </div>
        <div className="admin-footer-right">
            <a href="https://yourcompany.com" target="_blank" rel="noreferrer">
                Your Company
            </a>
        </div>
    </footer>
  );
}

export default Footer;