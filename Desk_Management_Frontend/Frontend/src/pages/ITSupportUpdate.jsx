import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const ITSupportUpdate = () => {
  const navigate = useNavigate();
  const { state: desk } = useLocation(); // desk data passed from previous page

  // Form state
  const [newStatus, setNewStatus] = useState("");
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().slice(0, 10)); // today
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [expectedDate, setExpectedDate] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Here, you can send the updated data to your API or context
    console.log({
      desk: desk?.desk || "112",
      currentStatus: desk?.status || "Maintenance",
      newStatus,
      updateDate,
      reason,
      notes,
      expectedDate,
    });

    alert("Desk status updated successfully!");
    navigate("/itsupport-dashboard"); // go back to dashboard
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-5 text-[#2c3e50]">
      <div className="max-w-[1400px] mx-auto">

        {/* Navbar */}
        <nav className="bg-white px-8 py-5 rounded-xl shadow flex justify-between items-center mb-8">
          <div className="text-[22px] font-bold text-[#667eea]">
            🪑 Desk Management System
          </div>
          <button
            onClick={() => navigate("/itsupport-dashboard")}
            className="bg-[#e74c3c] text-white px-5 py-2 rounded-md font-semibold text-sm"
          >
            Logout
          </button>
        </nav>

        {/* Content Card */}
        <div className="bg-white p-8 rounded-xl shadow">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-5 mb-6 gap-3">
            <h2 className="text-xl font-bold">Update Desk Status</h2>
            <button
              onClick={() => navigate("/itsupport-dashboard")}
              className="bg-[#667eea] text-white px-5 py-2 rounded-md font-semibold text-sm"
            >
              ← Back to Dashboard
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Desk Info */}
            <h3 className="text-lg font-semibold mb-4">Desk Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Desk Number</label>
                <input
                  type="text"
                  value={desk?.desk}
                  // readOnly
                  className="w-full p-4 border-2 border-gray-200 rounded-lg   font-semibold"
                />
              </div>
              <div>
                <label className="block mb-2 font-semibold text-gray-700">Current Status</label>
                <input
                  type="text"
                  value={desk?.status }
                  // readOnly
                  className="w-full p-4 border-2 border-gray-200 rounded-lg  font-semibold"
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
                  <option>Available</option>
                  <option>Maintenance</option>
                  <option>Inactive</option>
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
                <label className="block mb-2 font-semibold text-gray-700">Additional Notes </label>
                <input
                  type="text"
                  placeholder="Describe the issue or work performed..."
                  // required
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
                className="bg-[#667eea] text-white px-6 py-2 rounded-md font-semibold text-sm"
                onClick={() => navigate("/itsupport-update", { state: desk })}
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
