import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import TimeSheetsPage from "./pages/TimeSheetsPage";
import ProjectsPage from "./pages/ProjectsPage";
import UsersPage from "./pages/UsersPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import SalaryPage from "./pages/SalaryPage";
import MySalaryPage from "./pages/MySalaryPage";
import HolidaysPage from "./pages/HolidaysPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route for role-based access
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  const { currentUser } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  // Check token in localStorage first (for refresh scenarios)
  const hasToken = localStorage.getItem('authToken');
  
  // If there's a token but currentUser is still loading, show nothing (DashboardLayout will handle loading)
  if (hasToken && !currentUser) {
    return null;
  }

  // If no token or user doesn't have permission, redirect
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    setTimeout(() => navigate("/dashboard/timesheets", { replace: true }), 0);
    return null;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard/timesheets" replace />} />
            <Route path="timesheets" element={<TimeSheetsPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="approvals" element={<ProtectedRoute allowedRoles={['admin', 'manager']}><ApprovalsPage /></ProtectedRoute>} />
            <Route path="salary" element={<SalaryPage />} />
            <Route path="my-salary" element={<MySalaryPage />} />
            <Route path="holidays" element={<HolidaysPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
