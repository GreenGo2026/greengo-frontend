import { Navigate } from "react-router-dom";
import { isAdminLoggedIn } from "../services/adminJwt";

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  if (!isAdminLoggedIn()) {
    return <Navigate to="/gestion" replace />;
  }
  return <>{children}</>;
}
