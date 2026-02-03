import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { DeskContext } from "./DeskContext";
import { toast } from "react-toastify";

const ITSupportUpdate = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { desks, updateDeskStatus } = useContext(DeskContext);
  const [userProfile, setUserProfile] = useState(null);

  // Form state
  const [selectedDesk, setSelectedDesk] = useState(state?.desk_number || "");
  const [newStatus, setNewStatus] = useState("");
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedDate, setExpectedDate] = useState("");

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

  // Get current desk info
  const currentDesk = desks.find(d => d.desk_number === selectedDesk);
  const { assignments } = useContext(DeskContext);
  const currentAssignment = assignments.find(a =>
    a.desk_number === selectedDesk &&
    (a.released_date === null || a.released_date === "None")
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDesk) {
      toast.error("Please select a desk");
      return;
    }

    // Update desk status via DeskContext
    const success = await updateDeskStatus(selectedDesk, newStatus, {
      reason,
      notes,
      expected_resolution_date: expectedDate
    });

    if (success) {
      toast.success(`Desk ${selectedDesk} status updated to ${newStatus}`);
      navigate("/itsupport-dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-5 text-[#2c3e50]">
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
              className="bg-[#e74c3c] text-white px-5 py-2 rounded-md font-semibold text-sm"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Content Card */}
        <div className="bg-white p-8 rounded-xl shadow">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-5 mb-6 gap-3">
            <h2 className="text-xl font-bold">Update Desk Status {userProfile ? `(${userProfile.name})` : ""}</h2>
            <button
              onClick={() => navigate("/itsupport-dashboard")}
              className="bg-[#667eea] text-white px-5 py-2 rounded-md font-semibold text-sm"
            >
              ← Back to Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Desk Selection */}
            <h3 className="text-lg font-semibold mb-4">Select Desk</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Desk Number *</label>
                <select
                  required
                  value={selectedDesk}
                  onChange={(e) => setSelectedDesk(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg"
                >
                  <option value="">Select desk...</option>
                  {desks.map(d => (
                    <option key={d.id} value={d.desk_number}>
                      {d.desk_number} ({d.floor}) - {d.current_status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Assigned To</label>
                <input
                  type="text"
                  value={currentAssignment ? `${currentAssignment.employee_name} (${currentAssignment.department})` : "—"}
                  readOnly
                  className="w-full p-4 border-2 border-gray-200 rounded-lg bg-gray-50 font-semibold"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Current Status</label>
                <input
                  type="text"
                  value={currentDesk ? currentDesk.current_status : "—"}
                  readOnly
                  className="w-full p-4 border-2 border-gray-200 rounded-lg bg-gray-50 font-semibold text-blue-600"
                />
              </div>
            </div>

            {/* Update Status */}
            <h3 className="text-lg font-semibold mb-4">Update Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">New Status *</label>
                <select
                  required
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg"
                >
                  <option value="">Select status...</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Update Date *</label>
                <input
                  type="date"
                  required
                  value={updateDate}
                  onChange={(e) => setUpdateDate(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Reason for Status Change *</label>
                <select
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg"
                >
                  <option value="">Select reason...</option>
                  <option>Maintenance Completed</option>
                  <option>Requires Repair</option>
                  <option>Equipment Upgrade</option>
                  <option>Hardware Issue</option>
                  <option>Network Issue</option>
                  <option>Furniture Damage</option>
                  <option>Decommissioning</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Additional Notes</label>
                <input
                  type="text"
                  placeholder="Describe the issue or work performed..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Expected Resolution Date</label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full p-4 border-2 border-gray-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex gap-4 justify-end mt-6">
              <button
                type="button"
                onClick={() => navigate("/itsupport-dashboard")}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#667eea] text-white px-6 py-2 rounded-md font-semibold text-sm"
              >
                Update Status
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ITSupportUpdate;
