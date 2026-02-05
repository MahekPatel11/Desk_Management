import { useState, useContext, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DeskContext } from "./DeskContext";
import { toast } from "react-toastify";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [floor, setFloor] = useState("All");

  const { desks, assignments, employees, fetchDesks, fetchAssignments, fetchEmployees, fetchDeskRequests, deskRequests } = useContext(DeskContext);
  const [userProfile, setUserProfile] = useState(null);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [floors, setFloors] = useState([]);
  const [newFloorName, setNewFloorName] = useState("");
  const [newFloorNumber, setNewFloorNumber] = useState("");
  const [newFloorDept, setNewFloorDept] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptFloorId, setNewDeptFloorId] = useState("");

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

      // Fetch auto-assignment setting for admins
      const fetchAutoAssignment = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("/api/settings/auto-assignment", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await res.json();
          if (res.ok && typeof data.enabled === "boolean") {
            setAutoAssignEnabled(data.enabled);
          }
        } catch (e) {
          console.error("Error fetching auto-assignment setting", e);
        }
      };

      fetchAutoAssignment();
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

  const fetchFloors = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin-config/floors", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const sortedFloors = [...data].sort((a, b) => a.number - b.number);
        setFloors(sortedFloors);
      }
    } catch (e) {
      console.error("Error fetching floors", e);
    }
  };

  // Load floors for configuration forms
  useEffect(() => {
    fetchFloors();
  }, []);

  // No longer need manual load here as context handles it and we use useMemo below
  useEffect(() => {
    fetchDeskRequests();
  }, [fetchDeskRequests]);

  // Derive pending requests from context data
  const pendingRequests = useMemo(() => {
    return Array.isArray(deskRequests) ? deskRequests.filter(r => r.status === "PENDING") : [];
  }, [deskRequests]);

  const toggleAutoAssignment = async () => {
    try {
      const token = localStorage.getItem("token");
      const nextValue = !autoAssignEnabled;
      const res = await fetch("/api/settings/auto-assignment", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: nextValue }),
      });
      if (res.ok) {
        setAutoAssignEnabled(nextValue);
      }
    } catch (e) {
      console.error("Error updating auto-assignment setting", e);
    }
  };

  // Calculate dynamic stats from real data
  const stats = useMemo(() => {
    const totalDesks = desks.length;
    const todayIso = new Date().toISOString().split("T")[0];

    const hasCurrentAssignment = (desk) =>
      assignments.some(a =>
        a.desk_number === desk.desk_number &&
        (a.released_date === null || a.released_date === "None")
      );

    const assignedDesks = desks.filter(d => hasCurrentAssignment(d)).length;
    const availableDesks = desks.filter(d =>
      !["MAINTENANCE", "INACTIVE"].includes(d.current_status) && !hasCurrentAssignment(d)
    ).length;
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
    const todayIso = new Date().toISOString().split("T")[0];
    const latestAssignment = [...assignments]
      .filter(a => a.desk_number === desk.desk_number && (a.released_date === null || a.released_date === "None"))
      .sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date))[0];

    // Ensure floor is numeric
    const floorNum = typeof desk.floor === 'number' ? desk.floor : parseInt(desk.floor, 10);
    // Generate location from floor - ensure it always displays
    const location = desk.location ? desk.location : `Floor ${floorNum}`;

    return {
      ...desk,
      desk: desk.desk_number,
      floor: floorNum,
      location: location,
      status:
        desk.current_status === "MAINTENANCE"
          ? "Maintenance"
          : desk.current_status === "INACTIVE"
            ? "Inactive"
            : latestAssignment
              ? "Assigned"
              : "Available",
      user: latestAssignment
        ? `${latestAssignment.employee_name || latestAssignment.employee_code} (${latestAssignment.shift || "—"})`
        : "—",
      date: latestAssignment ? latestAssignment.assigned_date : (desk.updated_at ? desk.updated_at.split('T')[0] : "—"),
      department: latestAssignment ? (latestAssignment.department || "—") : "—",
      employeeId: latestAssignment ? latestAssignment.employee_code : "—",
      employeeDbId: latestAssignment ? latestAssignment.employee_id : null,
      deskDbId: desk.id,
      assignedBy: latestAssignment ? latestAssignment.assigned_by : (desk.current_status === "AVAILABLE" ? "—" : "System"),
      notes: latestAssignment ? latestAssignment.notes : ""
    };
  });

  // Filter desks based on search and filters
  const filteredDesks = processedDesks.filter((d) => {
    const matchSearch =
      d.desk.includes(search) ||
      (d.user && d.user.toLowerCase().includes(search.toLowerCase())) ||
      d.floor.toString().toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "All" || d.status === status;
    const matchFloor = floor === "All" || d.floor.toString() === floor;
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
            <div className="text-right">
              <div className="font-semibold">{userProfile ? userProfile.name : "Loading..."}</div>
              <div className="text-xs text-[#7f8c8d]">{userProfile ? userProfile.role : "Admin"}</div>
            </div>
            <button
              type="button"
              onClick={toggleAutoAssignment}
              className="px-4 py-2 bg-[#f1f5f9] text-[#334155] rounded-md text-xs font-semibold border border-[#e2e8f0]"
            >
              Auto-assign: {autoAssignEnabled ? "On" : "Off"}
            </button>
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

        {/* Configuration - Floors and Departments */}
        <div className="bg-white p-5 rounded-xl shadow mb-6">
          <h2 className="text-lg font-bold mb-4">Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add Floor */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Add Floor</h3>
              <div className="flex flex-col gap-3">
                <input
                  type="number"
                  placeholder="Floor number (e.g., 5)"
                  className="border-2 rounded-lg px-3 py-2 text-sm"
                  value={newFloorNumber}
                  onChange={(e) => setNewFloorNumber(e.target.value)}
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newFloorNumber) return;
                    try {
                      const token = localStorage.getItem("token");
                      const res = await fetch("/api/admin-config/floors", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          name: `Floor ${newFloorNumber}`,
                          number: Number(newFloorNumber),
                        }),
                      });
                      let data;
                      try {
                        const text = await res.text();
                        try {
                          data = JSON.parse(text);
                        } catch (e) {
                          data = { detail: text || "Server error. Please try again later." };
                        }
                      } catch (err) {
                        data = { detail: "Failed to read server response." };
                      }
                      if (res.ok) {
                        toast.success("Floor created successfully!");
                        fetchFloors();
                        setNewFloorName("");
                        setNewFloorNumber("");
                        setNewFloorDept("");
                      } else {
                        toast.error(data.detail || "Failed to create floor");
                        console.error("Failed to create floor", data);
                      }
                    } catch (e) {
                      toast.error("Could not connect to server");
                      console.error("Error creating floor", e);
                    }
                  }}
                  className="self-start px-4 py-2 bg-[#667eea] text-white rounded-md text-xs font-semibold"
                >
                  Add Floor
                </button>
              </div>
            </div>

            {/* Add Department */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Add Department</h3>
              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Department name (e.g., Sales)"
                  className="border-2 rounded-lg px-3 py-2 text-sm"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                />
                <select
                  className="border-2 rounded-lg px-3 py-2 text-sm"
                  value={newDeptFloorId}
                  onChange={(e) => setNewDeptFloorId(e.target.value)}
                >
                  <option value="">Select floor</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      Floor {f.number} {f.departments && f.departments.length > 0 ? `(${f.departments[0].name})` : "(Unassigned)"}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    if (!newDeptName || !newDeptFloorId) return;
                    try {
                      const token = localStorage.getItem("token");
                      const res = await fetch("/api/admin-config/departments", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          name: newDeptName,
                          floor_id: newDeptFloorId,
                        }),
                      });
                      let data;
                      try {
                        const text = await res.text();
                        try {
                          data = JSON.parse(text);
                        } catch (e) {
                          data = { detail: text || "Server error. Please try again later." };
                        }
                      } catch (err) {
                        data = { detail: "Failed to read server response." };
                      }
                      if (res.ok) {
                        toast.success("Department added successfully!");
                        fetchFloors();
                        setNewDeptName("");
                        setNewDeptFloorId("");
                      } else {
                        toast.error(data.detail || "Failed to create department");
                        console.error("Failed to create department", data);
                      }
                    } catch (e) {
                      toast.error("Could not connect to server");
                      console.error("Error creating department", e);
                    }
                  }}
                  className="self-start px-4 py-2 bg-[#667eea] text-white rounded-md text-xs font-semibold"
                >
                  Add Department
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Desk Requests */}
        {pendingRequests.length > 0 && (
          <div className="bg-white p-5 rounded-xl shadow mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Pending Desk Requests</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    {["Employee", "Department", "Shift", "From", "To", "Actions"].map((h) => (
                      <th key={h} className="p-3 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {r.employee_name}
                      </td>
                      <td className="p-3">{r.department}</td>
                      <td className="p-3">{r.shift}</td>
                      <td className="p-3">{r.from_date}</td>
                      <td className="p-3">{r.to_date}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          className="px-4 py-1 bg-[#667eea] text-white rounded-md text-xs font-semibold"
                          onClick={() =>
                            navigate("/assign-desk", {
                              state: {
                                mode: "assign",
                                desk_request_id: r.id,
                                requested_shift: r.shift,
                                requested_from_date: r.from_date,
                                requested_to_date: r.to_date,
                                requested_employee_code: r.employee_code,
                                employeeId: r.employee_code,
                                employee: r.employee_id,
                                employee_name: r.employee_name,
                                department: r.department,
                              },
                            })
                          }
                        >
                          Assign Desk
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
              <option value="All">All Floors</option>
              {floors.map(f => (
                <option key={f.id} value={f.number.toString()}>
                  Floor {f.number}
                </option>
              ))}
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
                    <td className="p-3 text-sm font-medium text-gray-700">{d.location || 'N/A'}</td>
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
