// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App

// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import Login from "./pages/Login";
// import EmployeeDashboard from "./pages/EmployeeDashboard";


// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;

import { Routes, Route, Navigate } from "react-router-dom";
// import { DeskProvider } from "./pages/DeskContext";
import Login from "./pages/Login";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeDetails from "./pages/EmployeeDetails";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDetails from "./pages/AdminDetails";
import AssignDesk from "./pages/AssignDesk";
import ITSupportDashboard from "./pages/ITSupportDashboard";
import ITSupportDetails from "./pages/ITSupportDetails";
import ITSupportUpdate from "./pages/ITSupportUpdate";



const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={<Login />} />
      <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
      <Route path="/employee-details" element={<EmployeeDetails />} />
      <Route path="/admin-dashboard" element={<AdminDashboard />} />
      <Route path="/admin-details" element={<AdminDetails />} />
      <Route path="/assign-desk" element={<AssignDesk />} />
      <Route path="/itsupport-dashboard" element={<ITSupportDashboard />} />
      <Route path="/itsupport-details" element={<ITSupportDetails />} />
      <Route path="/itsupport-update" element={<ITSupportUpdate />} />


    </Routes>
  );
};

export default App;
