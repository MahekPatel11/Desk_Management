import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DeskContext } from "./DeskContext";

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const {
    employees,
    assignments,
    desks,
    fetchDesks,
    fetchAssignments,
    fetchEmployees,
    createDeskRequest,
    fetchMyDeskRequests,
    myDeskRequests,
    loading,
  } = useContext(DeskContext); // Keep data integration
  const [myAssignment, setMyAssignment] = useState(null);
  const [allMyAssignments, setAllMyAssignments] = useState([]);
  const [myEmployeeProfile, setMyEmployeeProfile] = useState(null);
  const [requestShift, setRequestShift] = useState("MORNING");
  const [requestFromDate, setRequestFromDate] = useState("");
  const [requestToDate, setRequestToDate] = useState("");
  const [requestNote, setRequestNote] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Reset state before finding new profile
    setMyEmployeeProfile(null);
    setMyAssignment(null);
    setAllMyAssignments([]);

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      const userId = payload.user_id;

      if (!employees || employees.length === 0) return;

      const emp = employees.find(e => e.user_id === userId);
      if (emp) {
        setMyEmployeeProfile(emp);

        // Find all assignments for this employee
        const myHistory = assignments
          .filter(a => a.employee_code === emp.employee_code)
          .sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date));

        setAllMyAssignments(myHistory);

        // Find the latest assignment (the one with the latest assigned_date)
        const latest = myHistory.find(a =>
          (a.released_date === null || a.released_date === "None")
        );

        if (latest) {
          const desk = desks.find(d => d.desk_number === latest.desk_number);
          setMyAssignment({ ...latest, desk_info: desk });
        }
      }
    } catch (e) {
      console.error("Error decoding token or finding profile", e);
    }
  }, [employees, assignments, desks]);



  // Fetch latest data on mount
  useEffect(() => {
    fetchDesks();
    fetchAssignments();
    fetchEmployees();
    fetchMyDeskRequests();
  }, []);

  // Helper to find who a desk was reassigned to
  const getReassignedTo = (deskNumber, releasedDate) => {
    if (!releasedDate || releasedDate === "None") return null;

    // Find the assignment for the same desk that started on or after this release date
    const nextAssignment = assignments.find(a =>
      a.desk_number === deskNumber &&
      a.assigned_date >= releasedDate &&
      a.employee_code !== myEmployeeProfile?.employee_code
    );

    return nextAssignment ? nextAssignment.employee_name : null;
  };

  const handleSubmitDeskRequest = async (e) => {
    e.preventDefault();
    if (!requestFromDate || !requestToDate) {
      return;
    }
    if (requestFromDate > requestToDate) {
      return;
    }

    const payload = {
      shift: requestShift,
      from_date: requestFromDate,
      to_date: requestToDate,
      note: requestNote || null,
    };

    const result = await createDeskRequest(payload);
    if (result) {
      // Clear form after successful submission
      setRequestShift("MORNING");
      setRequestFromDate("");
      setRequestToDate("");
      setRequestNote("");
      // Refresh request history immediately
      fetchMyDeskRequests();
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="text-[#667eea] text-xl font-bold animate-pulse">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-5 font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] text-[#2c3e50]">
      <div className="max-w-[1400px] mx-auto">

        {/* Navbar */}
        <nav className="bg-white p-5 px-8 rounded-xl mb-8 shadow flex justify-between items-center flex-wrap gap-4">
          <div className="text-[22px] font-bold text-[#667eea]">
            🪑 Desk Management System
          </div>

          <div className="flex items-center gap-4 flex-wrap text-center sm:text-right">
            <div>
              <div className="font-semibold">{myEmployeeProfile ? myEmployeeProfile.name : "Loading..."}</div>
              <div className="text-xs text-[#7f8c8d]">{myEmployeeProfile ? myEmployeeProfile.department : "Employee"}</div>
            </div>

            <button
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
              className="px-5 py-2 bg-[#e74c3c] text-white rounded-md font-semibold text-sm"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[32px] font-bold">
                  {myAssignment ? myAssignment.desk_number : "No Desk"}
                </div>
                <div className="text-sm text-[#7f8c8d]">Your Assigned Desk</div>
              </div>
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#e3f2fd] text-[#2196f3] text-xl">
                🪑
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[32px] font-bold">
                  {myAssignment ? (myAssignment.floor || (myAssignment.desk_info ? myAssignment.desk_info.floor : "—")) : "—"}
                </div>
                <div className="text-sm text-[#7f8c8d]">Location</div>
              </div>
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-[#e8f5e9] text-[#4caf50] text-xl">
                📍
              </div>
            </div>
          </div>
        </div>

        {/* Desk Details */}
        <div className="bg-white p-8 rounded-xl shadow mb-5">
          <div className="flex justify-between items-center border-b-2 border-[#f0f0f0] pb-5 mb-6 flex-wrap gap-3">
            <h2 className="text-xl font-bold">Your Desk Details</h2>

            <button
              onClick={() => navigate("/employee-details")}
              className="px-5 py-2 bg-[#667eea] text-white rounded-md font-semibold text-sm"
            >
              View Full Details
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              ["Desk Number", myAssignment ? myAssignment.desk_number : "—"],
              ["Floor", myAssignment ? (myAssignment.floor || (myAssignment.desk_info ? myAssignment.desk_info.floor : "—")) : "—"],
              ["Status", (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                  ${myAssignment?.current_status === "INACTIVE" ? "bg-red-100 text-red-700" :
                    myAssignment?.current_status === "MAINTENANCE" ? "bg-yellow-100 text-yellow-700" :
                      myAssignment ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}
                `}>
                  {myAssignment ? (myAssignment.current_status || "Assigned") : "No Active Assignment"}
                </span>
              )],
              ["Assigned To", myEmployeeProfile ? `${myEmployeeProfile.name} (You)` : "—"],
              ["Assigned Date", myAssignment ? myAssignment.assigned_date : "—"],
              ["Assigned By", myAssignment ? myAssignment.assigned_by : "—"]
            ].map(([label, value], i) => (
              <div key={i} className="bg-[#f8f9fa] p-5 rounded-lg">
                <div className="text-xs uppercase font-semibold text-[#7f8c8d] mb-2">
                  {label}
                </div>
                <div className="font-semibold">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desk Request (Date Range + Shift) */}
        <div className="bg-white p-8 rounded-xl shadow mb-8">
          <div className="flex justify-between items-center border-b-2 border-[#f0f0f0] pb-5 mb-6 flex-wrap gap-3">
            <h2 className="text-xl font-bold">Request a Desk</h2>
          </div>

          <form
            onSubmit={handleSubmitDeskRequest}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end"
          >
            <div>
              <label className="block text-xs font-semibold text-[#7f8c8d] mb-2 uppercase">
                Shift
              </label>
              <select
                value={requestShift}
                onChange={(e) => setRequestShift(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="MORNING">Morning (10am–6pm)</option>
                <option value="NIGHT">Night (10pm–6am)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7f8c8d] mb-2 uppercase">
                From Date
              </label>
              <input
                type="date"
                value={requestFromDate}
                onChange={(e) => setRequestFromDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7f8c8d] mb-2 uppercase">
                To Date
              </label>
              <input
                type="date"
                value={requestToDate}
                onChange={(e) => setRequestToDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="block text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">
                Note (Optional)
              </label>
              <input
                type="text"
                placeholder="Any preference or note..."
                value={requestNote}
                onChange={(e) => setRequestNote(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <button
                type="submit"
                className="mt-2 px-4 py-2 bg-[#667eea] text-white rounded-md font-semibold text-sm"
              >
                Request Desk
              </button>
            </div>
          </form>

        </div>

        <div className="bg-white p-8 rounded-xl shadow mb-5">
          <h2 className="text-xl font-bold mb-6">Desk Request History</h2>
          {myDeskRequests && myDeskRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    {["Created", "Shift", "From", "To", "Status", "Desk"].map((h) => (
                      <th key={h} className="p-3 text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myDeskRequests.map((r) => (
                    <tr key={r.id} className="border-b">
                      <td className="p-3">
                        {r.created_at ? r.created_at.split("T")[0] : "—"}
                      </td>
                      <td className="p-3">{r.shift}</td>
                      <td className="p-3">{r.from_date}</td>
                      <td className="p-3">{r.to_date}</td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold
                          ${r.status === "APPROVED" ? "bg-green-100 text-green-700" : ""}
                          ${r.status === "PENDING" ? "bg-yellow-100 text-yellow-700" : ""}
                          ${r.status === "REJECTED" ? "bg-red-100 text-red-700" : ""}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {r.assigned_desk_number || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center text-[#7f8c8d] py-8 bg-[#f8f9fa] rounded-xl border-2 border-dashed">
              <div className="text-3xl mb-2">📝</div>
              <div>No desk requests found</div>
            </div>
          )}
        </div>

        {/* Assignment History */}
        <div className="bg-white p-8 rounded-xl shadow mb-5">
          <h2 className="text-xl font-bold mb-6">Assignment History</h2>

          {allMyAssignments.length > 0 ? (
            <div className="relative pl-10 border-l-2 border-[#e1e8ed] ml-3">
              {allMyAssignments.map((a, idx) => {
                const reassignedTo = getReassignedTo(a.desk_number, a.released_date);
                const isFuture =
                  a.start_date &&
                  new Date(a.start_date) > new Date();
                const windowLabel =
                  a.start_date && a.end_date
                    ? `${a.start_date} to ${a.end_date}`
                    : a.assigned_date;

                return (
                  <div key={idx} className="mb-8 relative">
                    <span className="absolute -left-[47px] top-[5px] w-4 h-4 bg-[#667eea] rounded-full border-4 border-white shadow" />
                    <div className="bg-[#f8f9fa] p-5 rounded-xl border border-transparent hover:border-[#667eea]/20 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-bold text-[#667eea]">Desk {a.desk_number}</div>
                        <div className="text-xs text-[#7f8c8d]">
                          {windowLabel}{" "}
                          {a.released_date && a.released_date !== "None"
                            ? `(Released ${a.released_date})`
                            : "(Active/Booked)"}
                        </div>
                      </div>
                      <div className="text-sm mb-1">
                        Assigned by <span className="font-semibold">{a.assigned_by}</span>
                      </div>
                      <div className="text-xs text-[#7f8c8d] mb-1">
                        Shift: <span className="font-semibold">{a.shift || "MORNING"}</span>
                      </div>
                      {isFuture && (
                        <div className="text-xs text-green-700 font-semibold mb-1">
                          Upcoming booking
                        </div>
                      )}
                      {reassignedTo && (
                        <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                          <div className="text-sm text-orange-600 font-medium flex items-center gap-2">
                            <span>🔄 Reassigned to:</span>
                            <span className="bg-orange-50 px-2 py-0.5 rounded">{reassignedTo}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-[#7f8c8d] py-12 bg-[#f8f9fa] rounded-xl border-2 border-dashed">
              <div className="text-3xl mb-2">📋</div>
              <div>No assignment history found for your profile</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboard;
