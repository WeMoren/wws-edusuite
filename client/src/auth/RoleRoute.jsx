import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const RoleRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const userRoles =
    Array.isArray(currentUser.roles) && currentUser.roles.length > 0
      ? currentUser.roles
      : currentUser.role
        ? [currentUser.role]
        : [];

  const hasAllowedRole = userRoles.some((role) =>
    allowedRoles.includes(role)
  );

  if (!hasAllowedRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleRoute;