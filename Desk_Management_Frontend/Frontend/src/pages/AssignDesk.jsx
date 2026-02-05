
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { DeskContext } from "./DeskContext";

// Removed hardcoded employeesData and desksData
const employeesData = [];
const desksData = [];

const AssignDesk = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const { assignDesk, desks, employees, assignments } = useContext(DeskContext);
  const [userProfile, setUserProfile] = useState(null);

  // Get user profile from JWT token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserProfile({
        name: payload.full_name || "Admin",
        role: payload.role || "Admin"
      });
    } catch (e) {
      console.error("Error decoding token", e);
      navigate("/login");
    }
  }, [navigate]);

  const [desk, setDesk] = useState(state.desk || "");
  const [floor, setFloor] = useState(state.floor || "");
  const [employee, setEmployee] = useState(state.employee || "");
  const [employeeId, setEmployeeId] = useState(state.employeeId || "");
  const [department, setDepartment] = useState(state.department || "");
  const [date, setDate] = useState(state.date || state.requested_from_date || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(state.requested_to_date || new Date().toISOString().split('T')[0]);
  const [shift, setShift] = useState(state.requested_shift || "MORNING");
  const [type, setType] = useState(state.type || "Permanent");
  const [notes, setNotes] = useState(state.notes || "");
  const [deskDepartmentName, setDeskDepartmentName] = useState("");
  const [floorConfig, setFloorConfig] = useState([]);

  // Fetch floor config to map departments to floors
  useEffect(() => {
    const fetchFloors = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/admin-config/floors", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const sortedData = Array.isArray(data) ? [...data].sort((a, b) => a.number - b.number) : [];
          setFloorConfig(sortedData);
        }
      } catch (e) {
        console.error("Error fetching floors", e);
      }
    };
    fetchFloors();
  }, []);

  // Pre-fill employee if requested_employee_code is present
  useEffect(() => {
    if (state.requested_employee_code && employees.length > 0 && !employee) {
      const found = employees.find(e => e.employee_code === state.requested_employee_code);
      if (found) {
        setEmployee(found.id);
      }
    }
  }, [state.requested_employee_code, employees, employee]);

  useEffect(() => {
    // employee is the ID now
    const emp = employees.find(e => e.id === employee);
    if (emp) {
      setEmployeeId(emp.employee_code);
      setDepartment(emp.department);

      // Auto-select floor based on department if not already set manually
      if (!floor && floorConfig.length > 0) {
        // Find floor that contains this department
        const targetFloor = floorConfig.find(f =>
          f.departments && f.departments.some(d => d.name === emp.department)
        );
        if (targetFloor) {
          setFloor(targetFloor.number); // Set floor NUMBER
        }
      }
    } else if (employee === "") {
      setEmployeeId("");
      setDepartment("");
    }
  }, [employee, employees, floorConfig]);

  useEffect(() => {
    // desk is the ID now
    const selectedDesk = desks.find(d => d.id === desk);
    if (selectedDesk) {
      setFloor(selectedDesk.floor);
      setDeskDepartmentName(selectedDesk.department_name || "");
    }
  }, [desk, desks]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!desk) {
      toast.error("Please select a desk");
      return;
    }
    if (!employee) {
      toast.error("Please select an employee");
      return;
    }
    if (endDate < date) {
      toast.error("End date cannot be before start date");
      return;
    }

    const success = await assignDesk({
      desk_id: desk,
      employee_id: employee,
      assignment_type: type.toUpperCase(),
      notes: notes || null,
      date: date,
      end_date: endDate,
      shift: shift,
      desk_request_id: state.desk_request_id || null,
      is_reassignment: state.mode === "reassign"
    });

    if (success) {
      navigate("/admin-dashboard");
    }
  };

  // Sort desks: Floor then Desk Number
  const sortedDesks = [...desks].sort((a, b) => {
    if (a.floor !== b.floor) return a.floor - b.floor;
    if (typeof a.desk_number === 'number' && typeof b.desk_number === 'number') {
      return a.desk_number - b.desk_number;
    }
    return a.desk_number.toString().localeCompare(b.desk_number.toString(), undefined, { numeric: true });
  });

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-5 text-[#2c3e50]">
      <div className="max-w-4xl mx-auto">
        <nav className="bg-white p-5 px-8 rounded-xl mb-8 shadow flex justify-between items-center">
          <div className="text-[22px] font-bold text-[#667eea]">🪑 Desk Management System</div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="font-semibold">{userProfile ? userProfile.name : "Loading..."}</div>
              <div className="text-xs text-[#7f8c8d]">{userProfile ? userProfile.role : "Admin"}</div>
            </div>
            <button onClick={() => navigate("/")} className="px-5 py-2 bg-[#e74c3c] text-white rounded-md font-semibold text-sm">Logout</button>
          </div>
        </nav>

        <div className="bg-white p-8 rounded-xl shadow">
          <div className="flex justify-between items-center border-b pb-5 mb-6">
            <h2 className="text-2xl font-bold">
              {state.mode === "assign" ? "Assign Desk" : state.mode === "reassign" ? "Reassign Desk" : "Update Desk"}
            </h2>
            <button onClick={() => navigate(-1)} className="px-4 py-2 bg-[#667eea] text-white rounded-lg font-semibold">← Back to Inventory</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Desk Number *</label>
                <select required value={desk} onChange={(e) => setDesk(e.target.value)} className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20">
                  <option value="">Choose desk...</option>
                  {sortedDesks
                    .filter(d => !floor || d.floor == floor) // Filter by floor if selected
                    .filter(d => {
                      if (department) {
                        return d.department_name === department;
                      }
                      return true;
                    })
                    .map(d => {
                      const activeAssignment = assignments.find(a =>
                        a.desk_number === d.desk_number &&
                        (a.released_date === null || a.released_date === "None")
                      );
                      const employeeName = activeAssignment ? (activeAssignment.employee_name || activeAssignment.employee_code) : "";
                      const isMaintenance = d.current_status === "MAINTENANCE";

                      return (
                        <option
                          key={d.id}
                          value={d.id}
                          disabled={isMaintenance}
                        >
                          {d.desk_number} (Floor {d.floor}) - {d.current_status} {employeeName ? `(${employeeName})` : ""}
                        </option>
                      );
                    })}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Floor</label>
                {/* Allow manual override or auto-set */}
                <select
                  className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg"
                  value={floor}
                  onChange={(e) => {
                    setFloor(e.target.value);
                    setDesk(""); // Reset desk on floor change because list changes
                  }}
                >
                  <option value="">All Floors</option>
                  {floorConfig.map(f => (
                    <option key={f.id} value={f.number}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Select Employee *</label>
                <select required value={employee} onChange={(e) => setEmployee(e.target.value)} className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20">
                  <option value="">Choose employee...</option>
                  {employees
                    .filter(emp => {
                      if (deskDepartmentName) {
                        return emp.department === deskDepartmentName;
                      }
                      return true; // Show all if no desk selected yet
                    })
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Employee ID</label>
                <input type="text" value={employeeId} readOnly className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg bg-[#f8f9fa] text-[#7f8c8d]" />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Department</label>
                <input
                  type="text"
                  value={deskDepartmentName || department}
                  readOnly
                  className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg bg-[#f8f9fa] text-[#7f8c8d]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">From Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20" />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">To Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Assignment Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20">
                  <option value="Permanent">Permanent</option>
                  <option value="Temporary">Temporary</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Shift</label>
                <select value={shift} onChange={(e) => setShift(e.target.value)} className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20">
                  <option value="MORNING">Morning (10am - 6pm)</option>
                  <option value="NIGHT">Night (10pm - 6am)</option>
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block mb-2 font-semibold text-[#34495e]">Notes (Optional)</label>
              <input type="text" placeholder="Add any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20" />
            </div>

            <div className="flex justify-end gap-4">
              <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 bg-[#e1e8ed] text-[#2c3e50] rounded-lg font-semibold">Cancel</button>
              <button type="submit" className="px-6 py-3 bg-[#4caf50] text-white rounded-lg font-semibold hover:bg-[#45a049]">{state.mode === "assign" ? "Assign Desk" : state.mode === "reassign" ? "Reassign Desk" : "Update Desk"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AssignDesk;
