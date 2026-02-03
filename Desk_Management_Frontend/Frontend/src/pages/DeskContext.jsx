import { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

export const DeskContext = createContext(null);

const DeskProvider = ({ children }) => {
  const [desks, setDesks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDesks = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/desks/?size=50", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setDesks(data.data || []);
      } else {
        console.error("Failed to fetch desks", data);
      }
    } catch (error) {
      console.error("Error fetching desks:", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/employees/?size=50", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const [assignments, setAssignments] = useState([]);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/assignments/?size=50", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setAssignments(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const assignDesk = async (assignmentData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/desks/assign-desk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(assignmentData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Assignment failed");
      }

      toast.success("Desk assigned successfully!");
      // Refresh data
      fetchDesks();
      fetchAssignments();
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const updateDeskStatus = async (deskNo, newStatus, additionalData = {}) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/desks/by-number/${deskNo}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_status: newStatus,
          ...additionalData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "Update failed");
      }

      toast.success("Desk status updated successfully!");
      // Refresh all data to ensure consistency across dashboards
      fetchDesks();
      fetchAssignments();
      fetchEmployees();
      return true;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  useEffect(() => {
    // Initial fetch if logged in
    const token = localStorage.getItem("token");
    if (token) {
      Promise.all([fetchDesks(), fetchEmployees(), fetchAssignments()]).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Set up polling for background updates every 30 seconds
    const interval = setInterval(() => {
      const activeToken = localStorage.getItem("token");
      if (activeToken) {
        fetchDesks();
        fetchEmployees();
        fetchAssignments();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <DeskContext.Provider value={{ desks, employees, assignments, assignDesk, updateDeskStatus, fetchDesks, fetchEmployees, fetchAssignments, loading }}>
      {children}
    </DeskContext.Provider>
  );
};

export default DeskProvider;
