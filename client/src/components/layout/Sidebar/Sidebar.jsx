import React from "react";
import "./Sidebar.css";
import sidebarMenu from "../../../data/sidebarMenu";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../../auth/AuthContext";

const Sidebar = () => {
  const { currentUser } = useAuth();

  const visibleMenuItems = sidebarMenu.filter((item) =>
    item.roles.includes(currentUser?.role)
  );

  return (
    <aside className="sidebar">
      <ul className="sidebar__menu">
        {visibleMenuItems.map((item) => (
          <li key={item.id} className="sidebar__item">
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                isActive
                  ? "sidebar__link active"
                  : "sidebar__link"
              }
              end={item.path === "/dashboard"}
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