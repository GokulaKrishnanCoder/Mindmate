// src/Component/PublicRoute.jsx
import { Navigate } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  // If token exists → already logged in → go to home
  if (token) {
    return <Navigate to="/home" replace />;
  }

  return children; // else allow access
};

export default PublicRoute;
