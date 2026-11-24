
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

  const visibleMenuItems = sidebarMenu.filter((item) => {
    if (item.access === "academicAnalytics") {
      return (
        userRoles.some((role) =>
          ["Principal", "School Admin", "Exam Officer"].includes(role)
        ) || currentUser?.isHeadTeacher === true
      );
    }

    return item.roles.some((role) => userRoles.includes(role));
  });

  return (
    <aside
      id="dashboard-sidebar"
      className={`sidebar${isOpen ? " sidebar--open" : ""}`}
      aria-label="Main navigation"
    >
      <ul className="sidebar__menu">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;

          return (
            <li key={item.id} className="sidebar__item">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive ? "sidebar__link active" : "sidebar__link"
                }
                end={item.path === "/dashboard"}
                onClick={onNavigate}
              >
                <Icon
                  className="sidebar__icon"
                  size={19}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span className="sidebar__label">{item.label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default Sidebar;
