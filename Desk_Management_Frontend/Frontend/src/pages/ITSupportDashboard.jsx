import { useContext, useState } from "react";
import { DeskContext } from "./DeskContext";
import { useNavigate } from "react-router-dom";

const ITSupportDashboard = () => {
  const { desks = [], updateDeskStatus } = useContext(DeskContext);
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [floorFilter, setFloorFilter] = useState("All");
  const [selectedDesk, setSelectedDesk] = useState(null);


  const filteredDesks = desks.filter(d =>
    (search === "" ||
      d.desk.toLowerCase().includes(search.toLowerCase()) ||
      d.floor.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "All" || d.status === statusFilter) &&
    (floorFilter === "All" || d.floor === floorFilter)
  );

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
              <div className="font-semibold">Mike Rodriguez</div>
              <div className="text-xs text-gray-500">IT Support</div>
            </div>
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2 bg-[#e74c3c] text-white rounded-md font-semibold text-sm"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Stat title="Total Desks" value={desks.length} icon="🪑" color="blue" />
          <Stat title="Available" value={desks.filter(d => d.status === "Available").length} icon="✓" color="green" />
          <Stat title="Under Maintenance" value={desks.filter(d => d.status === "Maintenance").length} icon="⚠" color="orange" />
          <Stat title="Inactive" value={desks.filter(d => d.status === "Inactive").length} icon="●" color="purple" />
        </div>

        {/* Content Card */}
        <div className="bg-white p-10  rounded-xl shadow">
          <div className="flex justify-between items-center border-b pb-5 mb-6">
            <h2 className="text-xl font-bold">Desk Status Management</h2>
            <button
              className="bg-[#667eea] text-white px-5 py-2 rounded-md font-semibold text-sm"
              onClick={() => navigate("/itsupport-update")}
            >
              Update Desk Status
            </button>


          </div>

          {/* Filters */}
          <div className="flex gap-4 flex-wrap mb-6">
            <input
              className="flex-1 min-w-[250px] border-2 border-[#e1e8ed] rounded-lg px-4 py-3 text-sm"
              placeholder="🔍 Search desks by number or location..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <select
              className="border-2 border-[#e1e8ed] rounded-lg px-4 py-3 text-sm"
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>Available</option>
              <option>Assigned</option>
              <option>Maintenance</option>
              <option>Inactive</option>
            </select>

            <select
              className="border-2 border-[#e1e8ed] rounded-lg px-4 py-3 text-sm"
              onChange={e => setFloorFilter(e.target.value)}
            >
              <option>All</option>
              <option>Floor 1</option>
              <option>Floor 2</option>
              <option>Floor 3</option>
              <option>Floor 4</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[#f8f9fa]">
                <tr>
                  {["Desk Number", "Location", "Current Status", "Last Maintenance", "Last Updated", "Actions"].map(h => (
                    <th key={h} className="text-left p-4 text-sm font-semibold border-b-2 border-[#e1e8ed]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredDesks.map(d => (
                  <tr key={d.desk} className="hover:bg-[#f8f9fa] border-b">
                    <td className="p-4 font-semibold">{d.desk}</td>
                    <td>{d.floor}</td>

                    <td>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold
                        ${d.status === "Available" && "bg-green-100 text-green-700"}
                        ${d.status === "Assigned" && "bg-blue-100 text-blue-700"}
                        ${d.status === "Maintenance" && "bg-yellow-100 text-yellow-700"}
                        ${d.status === "Inactive" && "bg-red-100 text-red-700"}
                      `}>
                        {d.status}
                      </span>
                    </td>

                    <td>{d.lastMaintenance}</td>
                    <td>{d.updated}</td>

                    <td className="space-x-2">
                      <button
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded"
                      onClick={() =>
                        navigate("/itsupport-details", { state: d })
                      }
                    >
                      View
                    </button>

                      {/* ONLY UPDATE STATUS */}
                      <select
                        className="border rounded px-2 py-1 text-xs"
                        value={d.status}
                        onChange={e => updateDeskStatus(d.desk, e.target.value)}
                      >
                        <option>Available</option>
                        <option>Maintenance</option>
                        <option>Inactive</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

/* Stats Card */
const Stat = ({ title, value, icon, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    orange: "bg-orange-100 text-orange-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow flex justify-between items-center">
      <div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-gray-500 text-sm">{title}</div>
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${colors[color]}`}>
        {icon}
      </div>
    </div>
  );
};

export default ITSupportDashboard;
