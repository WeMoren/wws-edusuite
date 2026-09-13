import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { usePlatformAuth } from "../auth/PlatformAuthContext";
import "../styles/developer.css";

const DeveloperLayout = () => {
  const { developer, logout } = usePlatformAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/platform/login");
  };

  return (
    <div className="developer-layout">
      <aside className="developer-sidebar">
        <div className="developer-sidebar__brand">
          <h2>WWS-EduSuite</h2>
          <span>Developer Panel</span>
        </div>

        <nav className="developer-sidebar__nav">
          <NavLink
            to="/platform"
            end
            className={({ isActive }) =>
              isActive
                ? "developer-nav-link active"
                : "developer-nav-link"
            }
          >
            Overview
          </NavLink>

          <NavLink
            to="/platform/schools"
            className={({ isActive }) =>
              isActive
                ? "developer-nav-link active"
                : "developer-nav-link"
            }
          >
            Schools
          </NavLink>

          <NavLink
            to="/platform/users"
            className={({ isActive }) =>
              isActive
                ? "developer-nav-link active"
                : "developer-nav-link"
            }
          >
            Users & Staff
          </NavLink>

          <NavLink
            to="/platform/subscriptions"
            className={({ isActive }) =>
              isActive
                ? "developer-nav-link active"
                : "developer-nav-link"
            }
          >
            Subscriptions
          </NavLink>

          <NavLink
            to="/platform/activity"
            className={({ isActive }) =>
              isActive
                ? "developer-nav-link active"
                : "developer-nav-link"
            }
          >
            Activity Log
          </NavLink>

          <NavLink
            to="/platform/system-health"
            className={({ isActive }) =>
              isActive
                ? "developer-nav-link active"
                : "developer-nav-link"
            }
          >
            System Health
          </NavLink>

          <NavLink
            to="/platform/development"
            className={({ isActive }) =>
              isActive
                ? "developer-nav-link active"
                : "developer-nav-link"
            }
          >
            Development
          </NavLink>
        </nav>

        <div className="developer-sidebar__footer">
          <p>
            {developer?.firstName} {developer?.lastName}
          </p>

          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className="developer-content">
        <Outlet />
      </main>
    </div>
  );
};

export default DeveloperLayout;