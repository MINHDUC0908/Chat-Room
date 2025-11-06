
// ProtectedRoute.js
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token"); // Lấy token từ localStorage

    if (!token) {
        // Nếu không có token thì quay về login
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;