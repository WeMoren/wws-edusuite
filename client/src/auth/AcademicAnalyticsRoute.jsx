import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const AcademicAnalyticsRoute = ({ children }) => {
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

  const hasAnalyticsRole = userRoles.some((role) =>
    ["Principal", "School Admin", "Exam Officer"].includes(role)
  );

  const isHeadTeacher = currentUser.isHeadTeacher === true;

  if (!hasAnalyticsRole && !isHeadTeacher) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AcademicAnalyticsRoute;