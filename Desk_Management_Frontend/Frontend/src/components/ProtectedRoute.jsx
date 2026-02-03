import { Navigate, Outlet } from "react-router-dom";
import { toast } from "react-toastify";

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  // Check if logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check if role is allowed
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    toast.error("Access Denied: You do not have permission to view this page.");
    // Redirect to their appropriate dashboard or login
    if (userRole === "EMPLOYEE") return <Navigate to="/employee-dashboard" replace />;
    if (userRole === "ADMIN") return <Navigate to="/admin-dashboard" replace />;
    if (userRole === "IT_SUPPORT") return <Navigate to="/itsupport-dashboard" replace />;

    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
