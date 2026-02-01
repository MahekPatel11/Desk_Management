// import { createContext, useState } from "react";

// export const DeskContext = createContext();

// export const DeskProvider = ({ children }) => {
//   const [deskAssignments, setDeskAssignments] = useState([
//     { desk: "205", floor: "Floor 2", status: "Assigned", assignedTo: "John Doe", date: "Jan 15, 2026", employeeId: "EMP-2156", department: "Engineering" },
//     { desk: "206", floor: "Floor 2", status: "Available", assignedTo: "", date: "Jan 10, 2026" },
//     { desk: "112", floor: "Floor 1", status: "Maintenance", assignedTo: "", date: "Jan 20, 2026" },
//     { desk: "301", floor: "Floor 3", status: "Assigned", assignedTo: "Emma Wilson", date: "Jan 18, 2026", employeeId: "EMP-2234", department: "Marketing" },
//     { desk: "302", floor: "Floor 3", status: "Available", assignedTo: "", date: "Jan 12, 2026" }
//   ]);

//   const assignDesk = (assignment) => {
//     setDeskAssignments(prev => {
//       const index = prev.findIndex(d => d.desk === assignment.desk);
//       if (index !== -1) {
//         // Update existing desk
//         const updated = [...prev];
//         updated[index] = { ...updated[index], ...assignment };
//         return updated;
//       } else {
//         // Add new desk
//         return [...prev, assignment];
//       }
//     });
//   };

//   return (
//     <DeskContext.Provider value={{ deskAssignments, assignDesk }}>
//       {children}
//     </DeskContext.Provider>
//   );
// };
import { createContext, useState } from "react";

export const DeskContext = createContext();

const initialDesks = [
  {
    desk: "205",
    floor: "Floor 2",
    status: "Assigned",
    lastMaintenance: "Dec 15, 2025",
    updated: "Jan 15, 2026",
  },
  {
    desk: "112",
    floor: "Floor 1",
    status: "Maintenance",
    lastMaintenance: "In Progress",
    updated: "Jan 20, 2026",
  },
  {
    desk: "206",
    floor: "Floor 2",
    status: "Available",
    lastMaintenance: "Jan 10, 2026",
    updated: "Jan 10, 2026",
  },
  {
    desk: "405",
    floor: "Floor 4",
    status: "Inactive",
    lastMaintenance: "Aug 5, 2025",
    updated: "Dec 1, 2025",
  },
];

export const DeskProvider = ({ children }) => {
  const [desks, setDesks] = useState(initialDesks);

  const updateDeskStatus = (deskNo, newStatus) => {
    setDesks(prev =>
      prev.map(d =>
        d.desk === deskNo
          ? { ...d, status: newStatus, updated: new Date().toDateString() }
          : d
      )
    );
  };

  return (
    <DeskContext.Provider value={{ desks, updateDeskStatus }}>
      {children}
    </DeskContext.Provider>
  );
};
