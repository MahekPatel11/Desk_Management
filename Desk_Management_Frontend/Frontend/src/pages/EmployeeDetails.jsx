import { useNavigate } from "react-router-dom";

const EmployeeDetails = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-5 text-[#2c3e50]">
      <div className="max-w-[1400px] mx-auto">

        {/* Navbar */}
        <nav className="bg-white p-5 px-8 rounded-xl mb-8 shadow flex justify-between items-center flex-wrap gap-4">
          <div className="text-[22px] font-bold text-[#667eea]">
            🪑 Desk Management System
          </div>

          <div className="flex items-center gap-4 flex-wrap text-center sm:text-right">
                <div className="text-left">
                    <div className="font-semibold">John Doe</div>
                    <div className="text-xs text-[#7f8c8d]">Employee</div>
                </div>

            <button
                onClick={() => navigate("/")}
                className="px-5 py-2 bg-[#e74c3c] text-white rounded-md font-semibold text-sm"
            >
                Logout
            </button>
          </div>
        </nav>

        {/* Content */}
        <div className="bg-white p-8 rounded-xl shadow">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <h2 className="text-xl font-bold">Complete Desk Information</h2>

            <button
              onClick={() => navigate("/employee-dashboard")}
              className="px-5 py-2 bg-[#667eea] text-white rounded-md font-semibold text-sm"
            >
              ← Back to Dashboard
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              ["Desk Number", "205"],
              ["Floor", "Floor 2"],
              ["Status", "Assigned"],
              ["Assigned To", "John Doe"],
              ["Assigned Date", "January 15, 2026"],
              ["Assigned By", "Admin - Sarah Johnson"],
              ["Department", "Engineering"]
            ].map(([label, value], i) => (
              <div key={i} className="bg-[#f8f9fa] p-5 rounded-lg">
                <div className="text-xs uppercase font-semibold text-[#7f8c8d] mb-2">
                  {label}
                </div>
                <div className="font-semibold">{value}</div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
