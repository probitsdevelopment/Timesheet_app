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

  // Wait for currentUser to load
  if (!currentUser) {
    return null;  // DashboardLayout will show loading spinner
  }

  // Check if user has permission
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/dashboard/timesheets" replace />;
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
