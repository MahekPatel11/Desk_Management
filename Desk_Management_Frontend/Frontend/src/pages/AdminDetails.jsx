import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const AdminDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state;
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

  // Fetch Desk History
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user || !user.desk) return;

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/desks/by-number/${user.desk}/history`, {
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
  }, [user]);

  if (!user) {
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
              onClick={() => navigate("/")}
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
            <h2 className="text-2xl font-bold">Desk Details - {user.desk}</h2>
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
              <div className="font-semibold text-[#2c3e50]">{user.desk}</div>
            </div>
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Floor</div>
              <div className="font-semibold text-[#2c3e50]">{user.floor}</div>
            </div>
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Current Status</div>
              <div className="font-semibold">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                  ${user.status === "Assigned" ? "bg-blue-100 text-blue-700" : ""}
                  ${user.status === "Available" ? "bg-green-100 text-green-700" : ""}
                  ${user.status === "Maintenance" ? "bg-yellow-100 text-yellow-700" : ""}
                  ${user.status === "Inactive" ? "bg-red-100 text-red-700" : ""}`}
                >
                  {user.status}
                </span>
              </div>
            </div>
          </div>

          {/* Current Assignment */}
          <h3 className="text-xl font-bold mb-4">Current Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Assigned To</div>
              <div className="font-semibold text-[#2c3e50]">{user.user || "-"}</div>
            </div>
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Department</div>
              <div className="font-semibold text-[#2c3e50]">{user.department || "—"}</div>
            </div>
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Assigned Date</div>
              <div className="font-semibold text-[#2c3e50]">{user.date}</div>
            </div>
            <div className="p-4 bg-[#f8f9fa] rounded-lg">
              <div className="text-xs font-semibold text-[#7f8c8d] mb-1 uppercase">Assigned By</div>
              <div className="font-semibold text-[#2c3e50]">{user.assignedBy || "—"}</div>
            </div>
          </div>

          {/* Assignment History */}
          <h3 className="text-xl font-bold mb-4">Assignment History</h3>
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
              <div className="p-6 text-center text-gray-400 italic">No history available for this desk</div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-[#f0f0f0]">
            {/* <button
              className="px-6 py-3 bg-[#667eea] text-white rounded-lg font-semibold"
              onClick={() => navigate("/assign-desk", { state: { mode: "reassign", ...user } })}
            >
              Reassign Desk
            </button> */}
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

export default AdminDetails;
