import { useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { DeskContext } from "./DeskContext";

const AdminDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { assignments, desks } = useContext(DeskContext);
  const userFromState = location.state;
  const [userProfile, setUserProfile] = useState(null);
  const [deskHistory, setDeskHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Get user profile from JWT token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));

      setUserProfile({
        name: payload.full_name || "Admin",
        role: payload.role === "ADMIN" ? "Administrator" : payload.role
      });
    } catch (e) {
      console.error("Error decoding token", e);
      navigate("/login");
    }
  }, [navigate]);

  // Derive most current desk and assignment data
  const deskNum = userFromState?.desk || userFromState?.desk_number;
  const desk = desks.find(d => d.desk_number === deskNum) || userFromState;

  const latestAssignment = [...assignments]
    .filter(a => a.desk_number === (desk?.desk_number || desk?.desk) && (a.released_date === null || a.released_date === "None"))
    .sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date))[0];

  const processedUser = {
    ...desk,
    desk: desk?.desk_number || desk?.desk,
    status: desk?.current_status === "MAINTENANCE" ? "Maintenance" :
      desk?.current_status === "INACTIVE" ? "Inactive" :
        latestAssignment ? "Assigned" : "Available",
    user: latestAssignment ? `${latestAssignment.employee_name || "Unknown"} (${latestAssignment.shift || "—"})` : "—",
    department: latestAssignment ? (latestAssignment.department || "—") : "—",
    date: latestAssignment ? latestAssignment.assigned_date : (desk?.updated_at ? desk.updated_at.split('T')[0] : "—"),
    assignedBy: latestAssignment ? latestAssignment.assigned_by : (desk?.current_status === "AVAILABLE" ? "—" : "System"),
    shift: latestAssignment ? latestAssignment.shift : "—"
  };

  // Fetch Desk History
  useEffect(() => {
    const fetchHistory = async () => {
      if (!deskNum) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/desks/by-number/${deskNum}/history`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setDeskHistory(data);
        } else {
          console.error("Failed to fetch history", data);
        }
      } catch (error) {
        console.error("Error fetching desk history:", error);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [deskNum]);



  if (!userFromState) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <h2 className="text-xl font-bold mb-4">No Desk Selected</h2>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-[#667eea] text-white rounded-lg font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // No longer using hardcoded history constant
  const history = deskHistory;

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-5 text-[#2c3e50]">
      <div className="max-w-4xl mx-auto">
        {/* Navbar */}
        <nav className="bg-white p-5 px-8 rounded-xl mb-8 shadow flex justify-between items-center">
          <div className="text-[22px] font-bold text-[#667eea]">
            🪑 Desk Management System
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="font-semibold">{userProfile ? userProfile.name : "Loading..."}</div>
              <div className="text-xs text-[#7f8c8d]">{userProfile ? userProfile.role : "Admin"}</div>
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

        {/* Content Card */}
        <div className="bg-white p-2 rounded-xl shadow">
          {/* Header */}
          <div className="flex justify-between items-center border-b pb-5 mb-6">
            <h2 className="text-2xl font-bold">Desk Details - {processedUser.desk}</h2>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-[#667eea] text-white rounded-lg font-semibold"
            >
              ← Back to Inventory
            </button>
          </div>

          {/* Desk Information */}
          <h3 className="text-xl font-bold mb-4">Desk Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Desk Number</div>
              <div className="font-semibold text-[#2c3e50]">{processedUser.desk}</div>
            </div>
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Floor</div>
              <div className="font-semibold text-[#2c3e50]">{processedUser.floor}</div>
            </div>
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Current Status</div>
              <div className="font-semibold">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                  ${processedUser.status === "Assigned" ? "bg-blue-100 text-blue-700" : ""}
                  ${processedUser.status === "Available" ? "bg-green-100 text-green-700" : ""}
                  ${processedUser.status === "Maintenance" ? "bg-yellow-100 text-yellow-700" : ""}
                  ${processedUser.status === "Inactive" ? "bg-red-100 text-red-700" : ""}`}
                >
                  {processedUser.status}
                </span>
              </div>
            </div>
          </div>

          {/* Current Assignment */}
          <h3 className="text-xl font-bold mb-4">Current Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Assigned To</div>
              <div className="font-semibold text-[#2c3e50]">{processedUser.user || "-"}</div>
            </div>
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Department</div>
              <div className="font-semibold text-[#2c3e50]">{processedUser.department || "—"}</div>
            </div>
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Shift</div>
              <div className="font-semibold text-[#2c3e50]">{processedUser.shift}</div>
            </div>
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Assigned Date</div>
              <div className="font-semibold text-[#2c3e50]">{processedUser.date}</div>
            </div>
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Assigned By</div>
              <div className="font-semibold text-[#2c3e50]">{processedUser.assignedBy || "—"}</div>
            </div>
          </div>

          {/* Two Column Layout: Scheduled Assignments & History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* Left Column: Assignment Status (Future/Active) */}
            <div>
              <h3 className="text-xl font-bold mb-4">Scheduled Assignments</h3>
              {historyLoading ? (
                <div className="p-4 bg-white rounded-lg border text-center text-gray-500">Loading schedules...</div>
              ) : (
                <div className="space-y-4">
                  {/* Filter assignments for this desk that are Active or Future */}
                  {/* We need to fetch real assignments for this desk first. 
                      Since we only grabbed history, let's fetch assignments now. 
                  */}
                  <AssignmentScheduleList deskNumber={processedUser.desk} />
                </div>
              )}
            </div>

            {/* Right Column: History */}
            <div>
              <h3 className="text-xl font-bold mb-4">History Log</h3>
              <div className="relative border-l-2 border-[#e1e8ed] ml-3">
                {historyLoading ? (
                  <div className="p-6 text-center text-gray-500 italic">Loading history...</div>
                ) : history.length > 0 ? (
                  history.map((item, index) => (
                    <div key={index} className="mb-6 ml-6 relative">
                      <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-[#667eea] border-2 border-white shadow" />
                      <div className="bg-[#f8f9fa] p-3 rounded-lg">
                        <div className="text-xs text-[#7f8c8d] mb-1">{item.date}</div>
                        <div className="text-sm text-[#2c3e50] font-medium">{item.text}</div>
                        {item.notes && <div className="text-xs text-gray-500 mt-1 italic">Note: {item.notes}</div>}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-400 italic">No history available</div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-[#f0f0f0]">
            <button
              className="px-6 py-3 bg-[#667eea] text-white rounded-lg font-semibold"
              onClick={() => {
                navigate("/assign-desk", {
                  state: {
                    mode: processedUser.status === "Available" ? "assign" : "reassign",
                    desk: processedUser.id,
                    employee: latestAssignment?.employee_id || "",
                    floor: processedUser.floor,
                    status: processedUser.status,
                    department: processedUser.department || "",
                    employeeId: latestAssignment?.employee_code || "",
                    date: latestAssignment?.assigned_date || ""
                  }
                });
              }}
            >
              {processedUser.status === "Available" ? "Assign Desk" : "Reassign Desk"}
            </button>
            <button
              className="px-6 py-3 bg-[#e1e8ed] text-[#2c3e50] rounded-lg font-semibold"
              onClick={() => navigate(-1)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AssignmentScheduleList = ({ deskNumber }) => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const token = localStorage.getItem("token");
        // Fetch assignments filtered by this desk number
        // We want all active/future ones. 
        // The API /assignments supports desk_number filter
        const res = await fetch(`/api/assignments/?desk_number=${deskNumber}&size=50`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const today = new Date().toISOString().split('T')[0];

          // Filter: End Date >= Today (Active or Future)
          // And Sort by Start Date
          const upcoming = (data.data || [])
            .filter(a => a.end_date >= today && (a.released_date === null || a.released_date === "None"))
            .sort((a, b) => a.start_date.localeCompare(b.start_date));

          setSchedules(upcoming);
        }
      } catch (e) {
        console.error("Error fetching schedules", e);
      } finally {
        setLoading(false);
      }
    };
    if (deskNumber) fetchSchedules();
  }, [deskNumber]);

  if (loading) return <div className="text-sm text-gray-500">Loading...</div>;
  if (schedules.length === 0) return <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-400 italic">No upcoming assignments</div>;

  return (
    <div className="space-y-3">
      {schedules.map((sch) => {
        const today = new Date().toISOString().split('T')[0];
        const isActive = sch.start_date <= today && sch.end_date >= today;

        return (
          <div key={sch.id} className={`p-4 rounded-lg border-l-4 shadow-sm ${isActive ? 'bg-green-50 border-green-500' : 'bg-blue-50 border-blue-500'}`}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-bold text-[#2c3e50]">{sch.employee_name}</div>
                <div className="text-xs text-gray-500">{sch.employee_code} • {sch.department}</div>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-bold ${isActive ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'}`}>
                {isActive ? "ACTIVE" : "UPCOMING"}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700">
              📅 {sch.start_date} <span className="text-gray-400">to</span> {sch.end_date}
            </div>
            {sch.notes && <div className="text-xs text-gray-500 mt-2 italic">"{sch.notes}"</div>}
          </div>
        )
      })}
    </div>
  );
};

export default AdminDetails;
