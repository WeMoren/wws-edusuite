import React from "react";
import "./Sidebar.css";
import sidebarMenu from "../../../data/sidebarMenu";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";

const Sidebar = ({ isOpen, onNavigate }) => {
  const { currentUser } = useAuth();

  const userRoles =
    Array.isArray(currentUser?.roles) && currentUser.roles.length > 0
      ? currentUser.roles
      : currentUser?.role
        ? [currentUser.role]
        : [];

  const visibleMenuItems = sidebarMenu.filter((item) =>
    item.roles.some((role) => userRoles.includes(role))
  );

  return (
    <aside
      id="dashboard-sidebar"
      className={`sidebar${isOpen ? " sidebar--open" : ""}`}
      aria-label="Main navigation"
    >
      <ul className="sidebar__menu">
        {visibleMenuItems.map((item) => (
          <li key={item.id} className="sidebar__item">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebar__link active" : "sidebar__link"
              }
              end={item.path === "/dashboard"}
              onClick={onNavigate}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
