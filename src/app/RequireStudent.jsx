// Route guard: shows the page only when a student is signed in, otherwise
// sends the visitor to the login page. Used for every student route in App.jsx.
// Signed-in pages share the sidebar state through AppSidebarProvider.
import { Navigate, useLocation } from "react-router-dom";
import { AppSidebarProvider } from "@/components/layout/AppSidebarProvider";
import { getDb } from "@/services/db";
import { getActiveStudentId } from "@/services/session";

export function RequireStudent({ children }) {
    const location = useLocation();
    if (!getActiveStudentId(getDb())) {
        return <Navigate to="/" replace state={{ from: location.pathname }} />;
    }
    return <AppSidebarProvider>{children}</AppSidebarProvider>;
}
