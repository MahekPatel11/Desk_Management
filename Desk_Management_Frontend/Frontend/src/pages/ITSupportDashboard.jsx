import { useContext, useState, useEffect } from "react";
import { DeskContext } from "./DeskContext";
import { useNavigate } from "react-router-dom";

const ITSupportDashboard = () => {
  const { desks = [], assignments = [], updateDeskStatus, fetchDesks, fetchAssignments } = useContext(DeskContext);
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [floorFilter, setFloorFilter] = useState("All");

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
        name: payload.full_name || "IT Support Member",
        role: payload.role === "IT_SUPPORT" ? "IT Support Specialist" : payload.role
      });
    } catch (e) {
      console.error("Error decoding token", e);
      navigate("/login");
    }
  }, [navigate]);

  // Fetch latest data on mount
  useEffect(() => {
    fetchDesks();
    fetchAssignments();
  }, []);

  const filteredDesks = desks.filter(d => {
    const assignment = assignments.find(a =>
      a.desk_number === d.desk_number &&
      (a.released_date === null || a.released_date === "None")
    );
    
    const searchLower = search.toLowerCase();
    const updatedDate = d.updated_at ? new Date(d.updated_at).toLocaleDateString() : "";
    const displayFloor = `Floor ${d.floor}`;
    
    const matchesSearch = search === "" ||
      d.desk_number.toString().toLowerCase().includes(searchLower) ||
      d.floor.toString().toLowerCase().includes(searchLower) ||
      displayFloor.toLowerCase().includes(searchLower) ||
      updatedDate.toLowerCase().includes(searchLower) ||
      (assignment && assignment.employee_name.toLowerCase().includes(searchLower));
    
    return matchesSearch &&
      (statusFilter === "All" || d.current_status === statusFilter) &&
      (floorFilter === "All" || d.floor.toString() === floorFilter);
  });

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-[#2c3e50] p-5">
      <div className="max-w-[1400px] mx-auto">

        {/* Navbar */}
        <nav className="bg-white px-8 py-5 rounded-xl shadow flex justify-between items-center mb-8">
          <div className="text-[22px] font-bold text-[#667eea]">
            🪑 Desk Management System
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-semibold">{userProfile ? userProfile.name : "Loading..."}</div>
              <div className="text-xs text-gray-500">{userProfile ? userProfile.role : "IT Support"}</div>
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          <Stat title="Total Desks" value={desks.length} icon="🪑" color="blue" />
          <Stat title="Available" value={desks.filter(d => d.current_status === "AVAILABLE").length} icon="✓" color="green" />
          <Stat title="Under Maintenance" value={desks.filter(d => d.current_status === "MAINTENANCE").length} icon="⚠" color="orange" />
          <Stat title="Assigned" value={desks.filter(d => d.current_status === "ASSIGNED").length} icon="●" color="purple" />
          <Stat title="Inactive" value={desks.filter(d => d.current_status === "INACTIVE").length} icon="🚫" color="red" />
        </div>

        {/* Content Card */}
        <div className="bg-white p-10  rounded-xl shadow">
          <div className="flex justify-between items-center border-b pb-5 mb-6">
            <h2 className="text-xl font-bold">Desk Status Management</h2>
            <button
              className="bg-[#667eea] text-white px-5 py-2 rounded-md font-semibold text-sm"
              onClick={() => navigate("/itsupport-update")}
            >
              Update Desk Status
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap mb-6">
            <input
              className="flex-1 min-w-[250px] border-2 border-[#e1e8ed] rounded-lg px-4 py-3 text-sm"
              placeholder="🔍 Search desks by number or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <select
              className="border-2 border-[#e1e8ed] rounded-lg px-4 py-3 text-sm"
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>AVAILABLE</option>
              <option>ASSIGNED</option>
              <option>MAINTENANCE</option>
              <option>INACTIVE</option>
            </select>

            <select
              className="border-2 border-[#e1e8ed] rounded-lg px-4 py-3 text-sm"
              onChange={e => setFloorFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="1">Floor 1</option>
              <option value="2">Floor 2</option>
              <option value="3">Floor 3</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[#f8f9fa]">
                <tr>
                  {["Desk Number", "Location", "Assigned To", "Current Status", "Last Updated", "Actions"].map(h => (
                    <th key={h} className="text-left p-4 text-sm font-semibold border-b-2 border-[#e1e8ed]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredDesks.map(d => {
                  const assignment = assignments.find(a =>
                    a.desk_number === d.desk_number &&
                    (a.released_date === null || a.released_date === "None")
                  );

                  return (
                    <tr key={d.id} className="hover:bg-[#f8f9fa] border-b">
                      <td className="p-4 font-semibold">{d.desk_number}</td>
                      <td>Floor {d.floor}</td>
                      <td className="text-sm">
                        {assignment ? (
                          <span className="font-semibold">{assignment.employee_name}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      <td>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold
                          ${d.current_status === "AVAILABLE" && "bg-green-100 text-green-700"}
                          ${d.current_status === "ASSIGNED" && "bg-blue-100 text-blue-700"}
                          ${d.current_status === "MAINTENANCE" && "bg-yellow-100 text-yellow-700"}
                          ${d.current_status === "INACTIVE" && "bg-red-100 text-red-700"}
                        `}>
                          {d.current_status}
                        </span>
                      </td>

                      <td>{d.updated_at ? new Date(d.updated_at).toLocaleDateString() : "—"}</td>

                      <td className="space-x-2">
                        <button
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
                          onClick={() =>
                            navigate("/itsupport-details", { state: d })
                          }
                        >
                          View
                        </button>
                        {/* Status Update Dropdown */}
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={d.current_status}
                          onChange={e => updateDeskStatus(d.desk_number, e.target.value)}
                        >
                          <option value="AVAILABLE">Available</option>
                          <option value="MAINTENANCE">Maintenance</option>
                          <option value="INACTIVE">Inactive</option>
                          {d.current_status === 'ASSIGNED' && <option value="ASSIGNED">Assigned</option>}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Stats Card */
const Stat = ({ title, value, icon, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center">
      <div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-gray-500 text-sm">{title}</div>
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colors[color]}`}>
        {icon}
      </div>
    </div>
  );
};

export default ITSupportDashboard;
