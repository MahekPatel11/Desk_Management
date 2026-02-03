import { useState, useContext, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DeskContext } from "./DeskContext";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [floor, setFloor] = useState("All");

  const { desks, assignments, employees, fetchDesks, fetchAssignments, fetchEmployees } = useContext(DeskContext);
  const [userProfile, setUserProfile] = useState(null);

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

  // Fetch latest data on mount
  useEffect(() => {
    fetchDesks();
    fetchAssignments();
    fetchEmployees();
  }, []);

  // Calculate dynamic stats from real data
  const stats = useMemo(() => {
    const totalDesks = desks.length;
    const assignedDesks = desks.filter(d => d.current_status === "ASSIGNED").length;
    const availableDesks = desks.filter(d => d.current_status === "AVAILABLE").length;
    const maintenanceDesks = desks.filter(d => d.current_status === "MAINTENANCE").length;
    const inactiveDesks = desks.filter(d => d.current_status === "INACTIVE").length;

    return {
      total: totalDesks,
      assigned: assignedDesks,
      available: availableDesks,
      maintenance: maintenanceDesks,
      inactive: inactiveDesks
    };
  }, [desks]);

  // Process desks with assignment data
  const processedDesks = desks.map(desk => {
    const activeAssignment = assignments.find(a =>
      a.desk_number === desk.desk_number &&
      (a.released_date === null || a.released_date === "None")
    );

    return {
      desk: desk.desk_number,
      floor: desk.floor,
      status: desk.current_status === "ASSIGNED" ? "Assigned" :
        desk.current_status === "AVAILABLE" ? "Available" :
          desk.current_status === "MAINTENANCE" ? "Maintenance" :
            desk.current_status === "INACTIVE" ? "Inactive" : desk.current_status,
      user: activeAssignment ? (activeAssignment.employee_name || activeAssignment.employee_code) : "—",
      date: activeAssignment ? activeAssignment.assigned_date : (desk.updated_at ? desk.updated_at.split('T')[0] : "—"),
      department: activeAssignment ? (activeAssignment.department || "—") : "—",
      employeeId: activeAssignment ? activeAssignment.employee_code : "—",
      employeeDbId: activeAssignment ? activeAssignment.employee_id : null,
      deskDbId: desk.id,
      assignedBy: activeAssignment ? activeAssignment.assigned_by : (desk.current_status === "AVAILABLE" ? "—" : "System"),
      notes: activeAssignment ? activeAssignment.notes : "",
      ...desk
    };
  });

  // Filter desks based on search and filters
  const filteredDesks = processedDesks.filter((d) => {
    const matchSearch =
      d.desk.includes(search) ||
      (d.user && d.user.toLowerCase().includes(search.toLowerCase())) ||
      d.floor.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "All" || d.status === status;
    const matchFloor = floor === "All" || d.floor === floor;
    return matchSearch && matchStatus && matchFloor;
  });

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-5 text-[#2c3e50]">
      <div className="max-w-[1400px] mx-auto">

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
              onClick={() => navigate("/")}
              className="px-5 py-2 bg-[#e74c3c] text-white rounded-md font-semibold text-sm"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Stats - Now Dynamic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          {[
            [stats.total.toString(), "Total Desks", "🪑", "bg-blue-100 text-blue-600"],
            [stats.assigned.toString(), "Assigned Desks", "✓", "bg-green-100 text-green-600"],
            [stats.available.toString(), "Available Desks", "○", "bg-purple-100 text-purple-600"],
            [stats.maintenance.toString(), "Maintenance", "⚠", "bg-orange-100 text-orange-600"],
            [stats.inactive.toString(), "Inactive", "🚫", "bg-red-100 text-red-600"]
          ].map(([value, label, icon, color], i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-3xl font-bold">{value}</div>
                  <div className="text-sm text-gray-500">{label}</div>
                </div>
                <div className={`w-12 h-12 flex items-center justify-center rounded-lg text-xl ${color}`}>
                  {icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desk Inventory - Now Dynamic */}
        <div className="bg-white p-2 rounded-xl shadow">
          <div className="flex justify-between items-center border-b pb-5 mb-6">
            <h2 className="text-xl font-bold">Desk Inventory</h2>
            <button
              className="px-8 py-2 bg-[#667eea] text-white rounded-md font-semibold text-base"
              onClick={() => navigate("/assign-desk", { state: { mode: "assign" } })}
            >
              + Assign Desk
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <input
              type="text"
              placeholder="🔍 Search..."
              className="border-2 rounded-lg px-4 py-2 flex-1 min-w-[250px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              className="border-2 rounded-lg px-4 py-2"
              onChange={(e) => setStatus(e.target.value)}
            >
              <option>All</option>
              <option>Available</option>
              <option>Assigned</option>
              <option>Maintenance</option>
              <option>Inactive</option>
            </select>

            <select
              className="border-2 rounded-lg px-4 py-2"
              onChange={(e) => setFloor(e.target.value)}
            >
              <option>All</option>
              <option>Floor 1</option>
              <option>Floor 2</option>
              <option>Floor 3</option>
            </select>
          </div>

          {/* Table - Now Dynamic */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  {["Desk", "Location", "Status", "Assigned To", "Updated", "Actions"].map(h => (
                    <th key={h} className="p-3 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDesks.map((d, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-semibold">{d.desk}</td>
                    <td className="p-3">{d.floor}</td>
                    <td className="p-6">
                      <span className={`px-3 py-2 rounded-full text-xs font-semibold
                        ${d.status === "Assigned" && "bg-blue-100 text-blue-700"}
                        ${d.status === "Available" && "bg-green-100 text-green-700"}
                        ${d.status === "Maintenance" && "bg-yellow-100 text-yellow-700"}
                        ${d.status === "Inactive" && "bg-red-100 text-red-700"}
                      `}>
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3">{d.user}</td>
                    <td className="p-3">{d.date}</td>
                    <td className="p-3 space-x-2 flex flex-wrap">
                      {/* VIEW button */}
                      <button
                        onClick={() => navigate("/admin-details", { state: d })}
                        className="px-5 py-2 bg-blue-200 text-blue-800 rounded-md text-sm font-semibold"
                      >
                        View
                      </button>

                      {/* ASSIGN / REASSIGN / UPDATE button */}
                      <button
                        disabled={d.status === "Maintenance" || d.status === "Inactive"}
                        onClick={() => {
                          if (d.status === "Maintenance" || d.status === "Inactive") return;

                          navigate("/assign-desk", {
                            state: {
                              mode: d.status === "Available" ? "assign" : "reassign",
                              desk: d.deskDbId, // Passing database ID
                              employee: d.employeeDbId, // Passing database ID
                              floor: d.floor,
                              status: d.status,
                              department: d.department || "",
                              employeeId: d.employeeId || "",
                              date: d.date || ""
                            }
                          });
                        }}
                        className={`px-5 py-2 rounded-md text-sm font-semibold
                            ${d.status === "Available"
                            ? "bg-green-200 text-green-800"
                            : d.status === "Assigned"
                              ? "bg-orange-200 text-orange-800"
                              : "bg-gray-300 text-gray-400 cursor-not-allowed opacity-60"
                          }`}
                      >
                        {d.status === "Available"
                          ? "Assign"
                          : d.status === "Assigned"
                            ? "Reassign"
                            : "Update"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
