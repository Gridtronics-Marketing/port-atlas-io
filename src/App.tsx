import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Locations from "./pages/Locations";
import Clients from "./pages/Clients";
import Employees from "./pages/Employees";
import WorkOrders from "./pages/WorkOrders";
import Scheduling from "./pages/Scheduling";
import FieldOperations from "./pages/FieldOperations";
import QualityAssurance from "./pages/QualityAssurance";
import AdvancedFeatures from "./pages/AdvancedFeatures";
import Integrations from "./pages/Integrations";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <Index />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <AppLayout>
                  <Projects />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/locations" element={
              <ProtectedRoute>
                <AppLayout>
                  <Locations />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/clients" element={
              <ProtectedRoute>
                <AppLayout>
                  <Clients />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute>
                <AppLayout>
                  <Employees />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/work-orders" element={
              <ProtectedRoute>
                <AppLayout>
                  <WorkOrders />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/scheduling" element={
              <ProtectedRoute>
                <AppLayout>
                  <Scheduling />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/field-operations" element={
              <ProtectedRoute>
                <AppLayout>
                  <FieldOperations />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/quality-assurance" element={
              <ProtectedRoute>
                <AppLayout>
                  <QualityAssurance />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/advanced-features" element={
              <ProtectedRoute>
                <AppLayout>
                  <AdvancedFeatures />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/integrations" element={
              <ProtectedRoute>
                <AppLayout>
                  <Integrations />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/user-management" element={
              <ProtectedRoute>
                <AppLayout>
                  <UserManagement />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <AppLayout>
                  <Profile />
                </AppLayout>
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
