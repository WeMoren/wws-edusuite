import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { usePlatformAuth } from "./PlatformAuthContext";

const PlatformProtectedRoute = () => {
  const { developer } = usePlatformAuth();

  if (!developer) {
    return <Navigate to="/platform/login" replace />;
  }

  return <Outlet />;
};

export default PlatformProtectedRoute;
