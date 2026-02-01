
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { DeskContext } from "/home/cygnet/Desk_Management/Desk_Management_Frontend/Frontend/src/pages/DeskContext.jsx";

const employeesData = [
  { name: "John Doe", employeeId: "EMP-2156", department: "Engineering" },
  { name: "Emma Wilson", employeeId: "EMP-2234", department: "Marketing" },
  { name: "David Smith", employeeId: "EMP-1998", department: "Sales" },
  { name: "Lisa Anderson", employeeId: "EMP-2301", department: "HR" }
];

const desksData = [
  { desk: "205", floor: "Floor 2", status: "Assigned" },
  { desk: "206", floor: "Floor 2", status: "Available" },
  { desk: "112", floor: "Floor 1", status: "Maintenance" },
  { desk: "301", floor: "Floor 3", status: "Assigned" },
  { desk: "302", floor: "Floor 3", status: "Available" }
];

const AssignDesk = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const { assignDesk } = useContext(DeskContext);

  const [desk, setDesk] = useState(state.desk || "");
  const [floor, setFloor] = useState(state.floor || "");
  const [employee, setEmployee] = useState(state.user || "");
  const [employeeId, setEmployeeId] = useState(state.employeeId || "");
  const [department, setDepartment] = useState(state.department || "");
  const [date, setDate] = useState(state.date || "");
  const [type, setType] = useState(state.type || "Permanent");
  const [notes, setNotes] = useState(state.notes || "");

  useEffect(() => {
    const emp = employeesData.find(e => e.name === employee);
    if (emp) {
      setEmployeeId(emp.employeeId);
      setDepartment(emp.department);
    } else {
      setEmployeeId("");
      setDepartment("");
    }
  }, [employee]);

  useEffect(() => {
    const selectedDesk = desksData.find(d => d.desk === desk);
    if (selectedDesk) setFloor(selectedDesk.floor);
    else setFloor("");
  }, [desk]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Push assignment to context
    assignDesk({
      desk,
      floor,
      assignedTo: employee,
      employeeId,
      department,
      date,
      type,
      notes
    });

    alert(`Desk ${desk} assigned to ${employee}`);
    navigate("/admin-dashboard"); // redirect to admin dashboard
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-5 text-[#2c3e50]">
      <div className="max-w-4xl mx-auto">
        <nav className="bg-white p-5 px-8 rounded-xl mb-8 shadow flex justify-between items-center">
          <div className="text-[22px] font-bold text-[#667eea]">🪑 Desk Management System</div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="font-semibold">Sarah Johnson</div>
              <div className="text-xs text-[#7f8c8d]">Admin / Manager</div>
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
            {/* Desk selection and employee details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Desk Number *</label>
                <select required value={desk} onChange={(e) => setDesk(e.target.value)} className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20">
                  <option value="">Choose desk...</option>
                  {desksData.map(d => (<option
    key={d.desk}
    value={d.desk}
    disabled={d.status === "Maintenance"}
  >
    {d.desk} ({d.floor}) {d.status === "Maintenance" ? "- Under Maintenance" : ""}
  </option>))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Floor</label>
                <input type="text" value={floor} readOnly className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg bg-[#f8f9fa] text-[#7f8c8d]" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Select Employee *</label>
                <select required value={employee} onChange={(e) => setEmployee(e.target.value)} className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20">
                  <option value="">Choose employee...</option>
                  {employeesData.map(emp => (<option key={emp.employeeId} value={emp.name}>{emp.name} ({emp.employeeId}) - {emp.department}</option>))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Employee ID</label>
                <input type="text" value={employeeId} readOnly className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg bg-[#f8f9fa] text-[#7f8c8d]" />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Department</label>
                <input type="text" value={department} readOnly className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg bg-[#f8f9fa] text-[#7f8c8d]" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Assignment Date *</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20" />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-[#34495e]">Assignment Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-3 border-2 border-[#e1e8ed] rounded-lg focus:outline-none focus:border-[#667eea] focus:ring-2 focus:ring-[#667eea]/20">
                  <option>Permanent</option>
                  <option>Temporary</option>
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
