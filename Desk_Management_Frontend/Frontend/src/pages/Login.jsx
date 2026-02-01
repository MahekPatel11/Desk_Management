// import { useState } from "react";

// const Login = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [role, setRole] = useState("");

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log({ email, password, role });
//   };

//   return (
//     <div className="login-box">
//       <div className="logo">
//         <h1>Desk Management System</h1>
//         <p>Manage office desks efficiently</p>
//       </div>

//       <form onSubmit={handleSubmit}>
//         <div className="form-group">
//           <label>Email Address</label>
//           <input
//             type="email"
//             placeholder="Enter your email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             required
//           />
//         </div>

//         <div className="form-group">
//           <label>Password</label>
//           <input
//             type="password"
//             placeholder="Enter your password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             required
//           />
//         </div>

//         <div className="form-group">
//           <label>Select Role</label>
//           <select
//             value={role}
//             onChange={(e) => setRole(e.target.value)}
//             required
//           >
//             <option value="">Choose your role</option>
//             <option value="employee">Employee</option>
//             <option value="admin">Admin / Manager</option>
//             <option value="itsupport">IT Support</option>
//           </select>
//         </div>

//         <button type="submit" className="btn">
//           Sign In
//         </button>
//       </form>

//       <div className="forgot-password">
//         <a href="#">Forgot Password?</a>
//       </div>
//     </div>
//   );
// };

// export default Login;


import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (role === "employee") {
      navigate("/employee-dashboard");
    }
    else if (role == "admin"){
      navigate("/admin-dashboard");
    }
    else if (role === "itsupport") {
    navigate("/itsupport-dashboard");
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

          <div>
            <label className="block text-sm font-medium mb-1">
              Select Role
            </label>
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
            >
              <option value="">Choose your role</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin / Manager</option>
              <option value="itsupport">IT Support</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-indigo-600 cursor-pointer">
          Forgot Password?
        </p>
      </div>
    </div>
  );
};

export default Login;
