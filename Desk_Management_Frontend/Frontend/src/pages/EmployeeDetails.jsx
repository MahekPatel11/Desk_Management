import { useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { DeskContext } from "./DeskContext";

const EmployeeDetails = () => {
  const navigate = useNavigate();
  const { employees, assignments, desks, fetchDesks, fetchAssignments, fetchEmployees } = useContext(DeskContext);
  const [myAssignment, setMyAssignment] = useState(null);
  const [myEmployeeProfile, setMyEmployeeProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Reset state
    setMyEmployeeProfile(null);
    setMyAssignment(null);

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      const userId = payload.user_id;

      if (!employees || employees.length === 0) return;

      const emp = employees.find(e => e.user_id === userId);
      if (emp) {
        setMyEmployeeProfile(emp);

        // Find assignment by employee_code AND ensure it's not released
        // Sort by assigned_date descending to get the newest one if multiple "active" ones exist
        const assignment = [...assignments]
          .sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date))
          .find(a =>
            a.employee_code === emp.employee_code &&
            (a.released_date === null || a.released_date === "None")
          );

        if (assignment) {
          const desk = desks.find(d => d.desk_number === assignment.desk_number);
          setMyAssignment({ ...assignment, desk_info: desk });
        }
      }
    } catch (e) {
      console.error("Error decoding token or finding profile", e);
      navigate("/login");
    }
  }, [employees, assignments, desks, navigate]);



  // Fetch latest data on mount
  useEffect(() => {
    fetchDesks();
    fetchAssignments();
    fetchEmployees();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-5 text-[#2c3e50]">
      <div className="max-w-[1400px] mx-auto">

        {/* Navbar */}
        <nav className="bg-white p-5 px-8 rounded-xl mb-8 shadow flex justify-between items-center flex-wrap gap-4">
          <div className="text-[22px] font-bold text-[#667eea]">
            🪑 Desk Management System
          </div>

          <div className="flex items-center gap-4 flex-wrap text-center sm:text-right">
            <div className="text-left">
              <div className="font-semibold">{myEmployeeProfile ? myEmployeeProfile.name : "Loading..."}</div>
              <div className="text-xs text-[#7f8c8d]">{myEmployeeProfile ? myEmployeeProfile.department : "Employee"}</div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                navigate("/login");
              }}
              className="px-5 py-2 bg-[#e74c3c] text-white rounded-md font-semibold text-sm"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="bg-white p-8 rounded-xl shadow">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <h2 className="text-xl font-bold">Complete Desk Information</h2>

            <button
              onClick={() => navigate("/employee-dashboard")}
              className="px-5 py-2 bg-[#667eea] text-white rounded-md font-semibold text-sm"
            >
              ← Back to Dashboard
            </button>
          </div>

          {myAssignment ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                ["Desk Number", myAssignment.desk_number],
                ["Floor", myAssignment.desk_info ? myAssignment.desk_info.floor : "—"],
                ["Status", (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                    ${myAssignment?.current_status === "INACTIVE" ? "bg-red-100 text-red-700" :
                      myAssignment?.current_status === "MAINTENANCE" ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"}
                  `}>
                    {myAssignment.current_status || "Assigned"}
                  </span>
                )],
                ["Assigned To", myEmployeeProfile ? myEmployeeProfile.name : "—"],
                ["Assigned Date", myAssignment.assigned_date],
                ["Assigned By", myAssignment.assigned_by],
                ["Department", myEmployeeProfile ? myEmployeeProfile.department : "—"]
              ].map(([label, value], i) => (
                <div key={i} className="bg-[#f8f9fa] p-5 rounded-lg">
                  <div className="text-xs uppercase font-semibold text-[#7f8c8d] mb-2">
                    {label}
                  </div>
                  <div className="font-semibold">{value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-[#7f8c8d] py-12">
              <div className="text-4xl mb-4">🪑</div>
              <div className="text-xl font-semibold mb-2">No Desk Assigned</div>
              <div className="text-sm">You don't have a desk assigned yet. Please contact your administrator.</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
