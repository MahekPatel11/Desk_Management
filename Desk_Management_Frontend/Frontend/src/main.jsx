// import React from "react";
// import ReactDOM from "react-dom/client";
// import { BrowserRouter } from "react-router-dom";
// import App from "./App";
// import "./index.css"; // Tailwind CSS
// // import { DeskProvider } from "/home/cygnet/Desk_Management/Desk_Management_Frontend/Frontend/src/pages/DeskContext.jsx";
// import DeskProvider from "./pages/DeskContext";


// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <DeskProvider>
//       <BrowserRouter>
//         <App />
//       </BrowserRouter>
//     </DeskProvider>

//   </React.StrictMode>
// );


import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import DeskProvider from "./pages/DeskContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <DeskProvider>
        <App />
      </DeskProvider>
    </BrowserRouter>
  </React.StrictMode>
);

