import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";
import "./Header.css";

const Header = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header__logo">
        <h2>WWS EduSuite</h2>
      </div>

      <div className="header__actions">
        <button type="button">🔔</button>

        <div className="header__profile">
          <div className="header__profile-info">
            <span className="header__profile-name">
              {currentUser
                ? `${currentUser.firstName} ${currentUser.lastName}`
                : "User"}
            </span>

            {currentUser && (
              <sup className="header__profile-role">
                {currentUser.role}
              </sup>
            )}
          </div>

          <button
            type="button"
            className="header__profile-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;