import { useNavigate } from "react-router-dom"; // ✅ ADD THIS

const EmployeeDashboard = () => {
  const navigate = useNavigate(); // ✅ ADD THIS

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
              <div className="font-semibold">John Doe</div>
              <div className="text-xs text-[#7f8c8d]">Employee</div>
            </div>

            {/* ✅ LOGOUT WORKING */}
            <button
              onClick={() => navigate("/login")}
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
                <div className="text-[32px] font-bold">205</div>
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
                <div className="text-[32px] font-bold">Floor 2</div>
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

            {/* ✅ DETAILS BUTTON WORKING */}
            <button
              onClick={() => navigate("/employee-details")}
              className="px-5 py-2 bg-[#667eea] text-white rounded-md font-semibold text-sm"
            >
              View Full Details
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              ["Desk Number", "205"],
              ["Floor", "Floor 2"],
              ["Status", <span className="px-3 py-1 rounded-full bg-[#cce5ff] text-[#004085] text-xs font-semibold">Assigned</span>],
              ["Assigned To", "John Doe (You)"],
              ["Assigned Date", "January 15, 2026"],
              ["Assigned By", "Admin - Sarah Johnson"]
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

        {/* Assignment History */}
        <div className="bg-white p-8 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-6">Assignment History</h2>

          <div className="relative pl-10">
            {[
              ["January 15, 2026 - 09:30 AM", "Assigned to Desk 205 by Admin Sarah Johnson"],
              ["December 10, 2025 - 02:15 PM", "Reassigned from Desk 112 to Desk 205"],
              ["November 1, 2025 - 10:00 AM", "Initially Assigned to Desk 112 by Admin Robert Chen"]
            ].map(([date, text], i) => (
              <div key={i} className="relative pb-8">
                <span className="absolute -left-[33px] top-[5px] w-3 h-3 bg-[#667eea] rounded-full border-[3px] border-white ring-2 ring-[#667eea]" />
                {i !== 2 && (
                  <span className="absolute -left-[28px] top-[17px] w-[2px] h-full bg-[#e1e8ed]" />
                )}
                <div className="bg-[#f8f9fa] p-4 rounded-lg">
                  <div className="text-xs text-[#7f8c8d] mb-1">{date}</div>
                  <div className="text-sm font-medium">{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default EmployeeDashboard;
