import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export const RequireAuth = ({
  children,
}: {
  children: React.ReactElement;
}) => {
  const { authenticated } = useAuth();
  return authenticated ? children : <Navigate to="/" replace />;
};
