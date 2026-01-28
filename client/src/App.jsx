import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDocuments from "./pages/AdminDocuments";
import { useAuth } from "./context/AuthContext";

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a loading spinner

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && user.systemRole !== "ADMIN") {
    return <Navigate to="/" />; // Redirect non-admins to home
  }

  return children;
};

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/documents"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDocuments />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
