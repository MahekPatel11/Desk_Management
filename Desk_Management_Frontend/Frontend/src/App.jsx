import { Routes, Route, Navigate } from "react-router-dom";
// import  DeskProvider  from "./pages/DeskContext";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeDetails from "./pages/EmployeeDetails";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDetails from "./pages/AdminDetails";
import AssignDesk from "./pages/AssignDesk";
import ITSupportDashboard from "./pages/ITSupportDashboard";
import ITSupportDetails from "./pages/ITSupportDetails";
import ITSupportUpdate from "./pages/ITSupportUpdate";



import Signup from "./pages/Signup";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Employee Routes */}
      <Route element={<ProtectedRoute allowedRoles={["EMPLOYEE"]} />}>
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
        <Route path="/employee-details" element={<EmployeeDetails />} />
      </Route>

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-details" element={<AdminDetails />} />
        <Route path="/assign-desk" element={<AssignDesk />} />
      </Route>

      {/* IT Support Routes */}
      <Route element={<ProtectedRoute allowedRoles={["IT_SUPPORT", "ADMIN"]} />}>
        <Route path="/itsupport-dashboard" element={<ITSupportDashboard />} />
        <Route path="/itsupport-details" element={<ITSupportDetails />} />
        <Route path="/itsupport-update" element={<ITSupportUpdate />} />
      </Route>

    </Routes>
  );
};

export default App;
