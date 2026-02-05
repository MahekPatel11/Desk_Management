import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      // Store token and role
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userEmail", normalizedEmail);

      toast.success(`Welcome back! Logged in as ${data.role}`);

      // Redirect based on role
      if (data.role === "EMPLOYEE") {
        navigate("/employee-dashboard");
      } else if (data.role === "ADMIN") {
        navigate("/admin-dashboard");
      } else if (data.role === "IT_SUPPORT") {
        navigate("/itsupport-dashboard");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Forgot password handler (JWT-based)
  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Please enter your email first");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      // Ask backend to create a short‑lived reset token for this email
      const response = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate reset token");
      }

      const resetToken = data.reset_token;

      toast.success("Reset token generated. Please set your new password.");

      // Navigate to reset password page with token in query string
      navigate(`/reset-password?token=${encodeURIComponent(resetToken)}`);
    } catch (error) {
      toast.error(error.message || "Something went wrong while generating reset token");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-2">
          Desk Management System
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Manage office desks efficiently
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Sign In
          </button>
        </form>

        {/* ✅ Forgot password */}
        <p
          className="text-center text-sm mt-4 text-indigo-600 cursor-pointer"
          onClick={handleForgotPassword}
        >
          Forgot Password?
        </p>
      </div>

      {/* Toast container */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Login;
