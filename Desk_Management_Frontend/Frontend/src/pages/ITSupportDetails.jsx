import { useNavigate, useLocation } from "react-router-dom";

const ITSupportDetails = () => {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Get desk data from state; fallback to dummy data if page refreshed
  const desk = state || {
    desk: "112",
    floor: "Floor 1",
    status: "Maintenance",
    lastMaintenance: "In Progress",
    maintenanceStarted: "January 20, 2026",
    issueReported: "Faulty power outlet",
    expectedCompletion: "January 25, 2026",
    assignedTo: "Mike Rodriguez",
    history: [
      {
        date: "January 20, 2026 - 10:15 AM",
        text: "<strong>Status Changed</strong> to Maintenance by IT Support - Mike Rodriguez<br>Reason: Faulty power outlet repair",
      },
      {
        date: "December 10, 2025 - 02:15 PM",
        text: "<strong>Status Changed</strong> to Available by Admin - Sarah Johnson<br>Reason: Employee reassignment",
      },
      {
        date: "July 15, 2025 - 09:30 AM",
        text: "<strong>Status Changed</strong> to Assigned by Admin - Robert Chen<br>Assigned to: Previous Employee",
      },
      {
        date: "May 1, 2025 - 11:00 AM",
        text: "<strong>Desk Added</strong> to system by IT Support - Alex Turner",
      },
    ],
  };

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
              <div className="font-semibold">{desk.assignedTo}</div>
              <div className="text-xs text-gray-900 font-semibold">IT Support</div>
            </div>
            <button
              className="bg-[#e74c3c] text-white px-5 py-2 rounded-md font-semibold text-sm"
              onClick={() => navigate("/login")}
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Content Card */}
        <div className="bg-white p-8 rounded-xl shadow">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-5 mb-6 gap-3">
            <h2 className="text-xl font-bold">Desk Technical Details - {desk.desk}</h2>
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
              <div className="text-md font-semibold">{desk.desk}</div>
            </div>
            <div className="bg-[#f8f9fa] p-5 rounded-lg">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Location</div>
              <div className="text-md font-semibold">{desk.floor}</div>
            </div>
            <div className="bg-[#f8f9fa] p-5 rounded-lg">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Current Status</div>
              <div className="text-md font-semibold">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold
                  ${desk.status === "Maintenance" ? "bg-yellow-100 text-yellow-700" : ""}
                  ${desk.status === "Available" ? "bg-green-100 text-green-700" : ""}
                  ${desk.status === "Assigned" ? "bg-blue-100 text-blue-700" : ""}
                `}>
                  {desk.status}
                </span>
              </div>
            </div>
          </div>

          {/* Maintenance Information */}
          <h3 className="text-lg font-semibold mb-4">Maintenance Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-[#f8f9fa] p-5 rounded-lg">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Last Maintenance</div>
              <div className="text-md font-semibold">{desk.lastMaintenance}</div>
            </div>
            <div className="bg-[#f8f9fa] p-5 rounded-lg">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Maintenance Started</div>
              <div className="text-md font-semibold">{desk.maintenanceStarted || "NA"}</div>
            </div>
            <div className="bg-[#f8f9fa] p-5 rounded-lg">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Issue Reported</div>
              <div className="text-md font-semibold">{desk.issueReported || "NA"}</div>
            </div>
            <div className="bg-[#f8f9fa] p-5 rounded-lg">
              <div className="text-xs text-gray-500 font-semibold uppercase mb-2">Expected Completion</div>
              <div className="text-md font-semibold">{desk.expectedCompletion || "NA"}</div>
            </div>
          </div>
          <div className="relative pl-10">
            {(desk.history || []).map((item, idx) => (
  <div key={idx} className="relative pb-8 last:pb-0">
    {/* Timeline circle */}
    <div className="absolute -left-8 top-1 w-3 h-3 rounded-full bg-[#667eea] border-2 border-white shadow-md"></div>
    {/* Timeline line */}
    {idx !== (desk.history?.length - 1) && <div className="absolute -left-6 top-4 w-0.5 h-full bg-gray-300"></div>}
    <div className="bg-[#f8f9fa] p-4 rounded-lg">
      <div className="text-xs text-gray-500 mb-1">{item.date}</div>
      <div className="text-sm text-[#2c3e50]" dangerouslySetInnerHTML={{ __html: item.text }} />
    </div>
  </div>
))}

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
    </div>
  );
};

export default ITSupportDetails;
