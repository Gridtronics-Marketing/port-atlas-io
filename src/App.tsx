import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAUpdateNotification } from "@/components/PWAUpdateNotification";
import { OfflineStatusIndicator } from "@/components/OfflineStatusIndicator";
import { InAppEducationBanner } from "@/components/InAppEducationBanner";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import Index from "./pages/Index";
import Projects from "./pages/Projects";
import Contracts from "./pages/Contracts";
import Maintenance from "./pages/Maintenance";
import Locations from "./pages/Locations";
import Clients from "./pages/Clients";
import Employees from "./pages/Employees";
import WorkOrders from "./pages/WorkOrders";
import Scheduling from "./pages/Scheduling";
import FieldOperations from "./pages/FieldOperations";
import QualityAssurance from "./pages/QualityAssurance";
import Settings from "./pages/Settings";
import AdvancedFeatures from "./pages/AdvancedFeatures";
import Integrations from "./pages/Integrations";
import Communications from "./pages/Communications";
import TwilioSettings from "./pages/TwilioSettings";
import UserManagement from "./pages/UserManagement";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Procurement from "./pages/Procurement";
import FloorPlanEditor from "./pages/FloorPlanEditor";
import OrganizationOnboarding from "./pages/OrganizationOnboarding";
import AdminOrganizations from "./pages/AdminOrganizations";
import OrganizationSettings from "./pages/OrganizationSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OrganizationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <PWAUpdateNotification />
        <PWAInstallPrompt />
        <OfflineStatusIndicator />
        <InAppEducationBanner />
        <ImpersonationBanner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding/organization" element={
              <ProtectedRoute>
                <OrganizationOnboarding />
              </ProtectedRoute>
            } />
            <Route path="/admin/organizations" element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminOrganizations />
              </AppLayout>
            </ProtectedRoute>
            } />
            <Route path="/organization/settings" element={
              <ProtectedRoute>
                <AppLayout>
                  <OrganizationSettings />
                </AppLayout>
              </ProtectedRoute>
            } />
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
            <Route path="/contracts" element={
              <ProtectedRoute>
                <AppLayout>
                  <Contracts />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/maintenance" element={
              <ProtectedRoute>
                <AppLayout>
                  <Maintenance />
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
            <Route path="/settings" element={
              <ProtectedRoute>
                <AppLayout>
                  <Settings />
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
            <Route path="/communications" element={
              <ProtectedRoute>
                <AppLayout>
                  <Communications />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/twilio-settings" element={
              <ProtectedRoute>
                <AppLayout>
                  <TwilioSettings />
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
            <Route path="/procurement" element={
              <ProtectedRoute>
                <AppLayout>
                  <Procurement />
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
            <Route path="/floor-plan-editor" element={
              <ProtectedRoute>
                <FloorPlanEditor />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </OrganizationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
