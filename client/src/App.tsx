import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UserDashboard from "./pages/UserDashboard";
import LiveRoom from "./pages/LiveRoom";

export default function App() {
  const role = localStorage.getItem("role");

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={role === "admin" ? <AdminDashboard /> : <Navigate to="/" />} />
        <Route path="/dashboard" element={role ? <UserDashboard /> : <Navigate to="/" />} />
        <Route path="/room/:id" element={role ? <LiveRoom /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
