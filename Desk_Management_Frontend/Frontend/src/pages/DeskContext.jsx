import { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";

export const DeskContext = createContext(null);

const DeskProvider = ({ children }) => {
  const [desks, setDesks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [deskRequests, setDeskRequests] = useState([]);
  const [myDeskRequests, setMyDeskRequests] = useState([]);
  const [assignments, setAssignments] = useState([]);
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

  const fetchDeskRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];
      const response = await fetch("/api/desk-requests/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setDeskRequests(Array.isArray(data) ? data : []);
        return data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching desk requests:", error);
      return [];
    }
  };

  const fetchMyDeskRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return [];
      const response = await fetch("/api/desk-requests/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setMyDeskRequests(Array.isArray(data) ? data : []);
        return data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching my desk requests:", error);
      return [];
    }
  };

  const assignDesk = async (assignmentData) => {
    try {
      const token = localStorage.getItem("token");

      // Validate required fields
      if (!assignmentData.desk_id) {
        toast.error("Please select a desk");
        return false;
      }
      if (!assignmentData.employee_id) {
        toast.error("Please select an employee");
        return false;
      }

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
        throw new Error(data.detail || data.error || "Assignment failed");
      }

      toast.success("Desk assigned successfully!");
      // Refresh data
      fetchDesks();
      fetchAssignments();
      fetchDeskRequests();
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

  const createDeskRequest = async (requestData) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You must be logged in to request a desk");
        return null;
      }

      const response = await fetch("/api/desk-requests/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "Failed to create desk request");
      }

      toast.success(
        data.assigned_desk
          ? "Desk requested and auto-assigned successfully!"
          : "Desk request created successfully"
      );

      // Refresh to pick up any new assignments
      fetchDesks();
      fetchAssignments();
      fetchEmployees();

      return data;
    } catch (error) {
      toast.error(error.message || "Unable to create desk request");
      return null;
    }
  };

  useEffect(() => {
    // Initial fetch if logged in
    const token = localStorage.getItem("token");
    if (token) {
      const role = localStorage.getItem("role");
      const fetches = [fetchDesks(), fetchEmployees(), fetchAssignments()];
      if (role === "ADMIN") fetches.push(fetchDeskRequests());
      if (role === "EMPLOYEE") fetches.push(fetchMyDeskRequests());

      Promise.all(fetches).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Set up polling for background updates every 60 seconds (reduced from 30s to improve performance)
    const interval = setInterval(() => {
      const activeToken = localStorage.getItem("token");
      if (activeToken) {
        const role = localStorage.getItem("role");
        fetchDesks();
        fetchEmployees();
        fetchAssignments();
        if (role === "ADMIN") fetchDeskRequests();
        if (role === "EMPLOYEE") fetchMyDeskRequests();
      }
    }, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <DeskContext.Provider
      value={{
        desks,
        employees,
        assignments,
        assignDesk,
        updateDeskStatus,
        fetchDesks,
        fetchEmployees,
        fetchAssignments,
        createDeskRequest,
        fetchDeskRequests,
        fetchMyDeskRequests,
        deskRequests,
        myDeskRequests,
        loading,
      }}
    >
      {children}
    </DeskContext.Provider>
  );
};

export default DeskProvider;
