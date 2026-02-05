import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { DeskContext } from "./DeskContext";

const ITSupportDetails = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { assignments } = useContext(DeskContext);
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
        name: payload.full_name || "IT Support Member",
        role: payload.role === "IT_SUPPORT" ? "IT Support Specialist" : payload.role
      });
    } catch (e) {
      console.error("Error decoding token", e);
      navigate("/login");
    }
  }, [navigate]);

  // Fetch Desk History
  useEffect(() => {
    const fetchHistory = async () => {
      if (!state || !state.desk_number) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/desks/by-number/${state.desk_number}/history`, {
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
  }, [state]);

  // If no desk data passed, redirect back
  if (!state) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] text-[#2c3e50] p-5 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-xl font-semibold mb-4">No Desk Selected</div>
          <button
            className="bg-[#667eea] text-white px-6 py-2 rounded-md font-semibold"
            onClick={() => navigate("/itsupport-dashboard")}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const desk = state;

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
              <div className="text-xs text-gray-900 font-semibold">{userProfile ? userProfile.role : "IT Support"}</div>
            </div>
            <button
              className="bg-[#e74c3c] text-white px-5 py-2 rounded-md font-semibold text-sm"
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("role");
                navigate("/login");
              }}
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Content Card */}
        <div className="bg-white p-8 rounded-xl shadow">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-5 mb-6 gap-3">
            <h2 className="text-xl font-bold">Desk Technical Details - {desk.desk_number}</h2>
            <button
              className="bg-[#667eea] text-white px-5 py-2 rounded-md font-semibold text-sm"
              onClick={() => navigate("/itsupport-dashboard")}
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Desk Information */}
          <h3 className="text-lg font-semibold mb-4">Desk Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#f8f9fa] p-5 rounded-lg">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Desk Number</div>
              <div className="text-md font-semibold">{desk.desk_number}</div>
            </div>
            <div className="bg-[#f8f9fa] p-5 rounded-lg">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Location</div>
              <div className="text-md font-semibold">Floor {Math.floor(parseInt(desk.desk_number) / 100)}</div>
            </div>
            <div className="bg-[#f8f9fa] p-5 rounded-lg">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Current Status</div>
              <div className="text-md font-semibold">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                  ${desk.current_status === "MAINTENANCE" ? "bg-yellow-100 text-yellow-700" : ""}
                  ${desk.current_status === "AVAILABLE" ? "bg-green-100 text-green-700" : ""}
                  ${desk.current_status === "ASSIGNED" ? "bg-blue-100 text-blue-700" : ""}
                  ${desk.current_status === "INACTIVE" ? "bg-red-100 text-red-700" : ""}
                `}>
                  {desk.current_status}
                </span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#f8f9fa] p-5 rounded-lg">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Assigned To</div>
              <div className="text-md font-semibold">
                {(() => {
                  const assignment = assignments
                    .filter(a => a.desk_number === desk.desk_number && (a.released_date === null || a.released_date === "None"))
                    .sort((a, b) => new Date(b.assigned_date) - new Date(a.assigned_date))[0];
                  return assignment ? `${assignment.employee_name} (${assignment.department}) - ${assignment.shift}` : "—";
                })()}
              </div>
            </div>
            <div className="bg-[#f8f9fa] p-5 rounded-lg">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Created At</div>
              <div className="text-md font-semibold">
                {desk.created_at ? new Date(desk.created_at).toLocaleString() : "—"}
              </div>
            </div>
            <div className="bg-[#f8f9fa] p-5 rounded-lg">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Last Updated</div>
              <div className="text-md font-semibold">
                {desk.updated_at ? new Date(desk.updated_at).toLocaleString() : "—"}
              </div>
            </div>
          </div>

        </div>

        {/* Assignment History */}
        <h3 className="text-lg font-semibold mb-4">Assignment & Status History</h3>
        <div className="relative border-l-2 border-[#e1e8ed] ml-3 mb-8">
          {historyLoading ? (
            <div className="p-6 text-center text-gray-500 italic">Loading history...</div>
          ) : deskHistory.length > 0 ? (
            deskHistory.map((item, index) => (
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
            <div className="p-6 text-center text-gray-400 italic">No history available for this desk</div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 justify-end mt-8 pt-4 border-t border-gray-200">
          <button
            className="bg-gray-200 text-[#2c3e50] px-6 py-2 rounded-md font-semibold text-sm"
            onClick={() => navigate("/itsupport-dashboard")}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default ITSupportDetails;
