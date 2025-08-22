import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="notfound-container">
      <h1 className="notfound-title">404</h1>
      <h2 className="notfound-subtitle">Oops! Page not found</h2>
      <p className="notfound-text">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link to="/" className="notfound-button">
        Go Back Home
      </Link>
    </div>
  );
}

export default NotFound;
