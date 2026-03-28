import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/components/AuthProvider";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { OfflineSyncProvider } from "@/contexts/OfflineSyncContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { PublicLayout } from "@/components/PublicLayout";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAUpdateNotification } from "@/components/PWAUpdateNotification";
import { OfflineStatusIndicator } from "@/components/OfflineStatusIndicator";
import { InAppEducationBanner } from "@/components/InAppEducationBanner";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import ScrollToTop from "@/components/ScrollToTop";
import { AnalyticsProvider } from "@/components/AnalyticsProvider";

// Protected pages
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
import ServiceRequests from "./pages/ServiceRequests";
import ClientLocationDetail from "./pages/ClientLocationDetail";
import ServiceRequestHistory from "./pages/ServiceRequestHistory";
import PortalEntry from "./pages/PortalEntry";
import ClientPortalManagement from "./pages/ClientPortalManagement";
import TradeTube from "./pages/TradeTube";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import DocsPage from "./pages/DocsPage";
import Invoices from "./pages/Invoices";
import Quotes from "./pages/Quotes";
import Expenses from "./pages/Expenses";

// Public pages
import LandingPage from "./pages/LandingPage";
import FeaturesPage from "./pages/FeaturesPage";
import PricingPage from "./pages/PricingPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import GetStartedPage from "./pages/GetStartedPage";
import CareersPage from "./pages/CareersPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import HelpPage from "./pages/HelpPage";
import APIPage from "./pages/APIPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import SecurityPage from "./pages/SecurityPage";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfflineSyncProvider>
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
                <AnalyticsProvider>
                  <ScrollToTop />
                  <Routes>
                  {/* Public marketing pages */}
                  <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
                  <Route path="/home" element={<Navigate to="/" replace />} />
                  <Route path="/features" element={<PublicLayout><FeaturesPage /></PublicLayout>} />
                  <Route path="/pricing" element={<PublicLayout><PricingPage /></PublicLayout>} />
                  <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
                  <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
                  <Route path="/get-started" element={<PublicLayout><GetStartedPage /></PublicLayout>} />
                  <Route path="/careers" element={<PublicLayout><CareersPage /></PublicLayout>} />
                  <Route path="/blog" element={<PublicLayout><BlogPage /></PublicLayout>} />
                  <Route path="/blog/:slug" element={<PublicLayout><BlogPostPage /></PublicLayout>} />
                  <Route path="/help" element={<PublicLayout><HelpPage /></PublicLayout>} />
                  <Route path="/api" element={<PublicLayout><APIPage /></PublicLayout>} />
                  <Route path="/privacy" element={<PublicLayout><PrivacyPage /></PublicLayout>} />
                  <Route path="/terms" element={<PublicLayout><TermsPage /></PublicLayout>} />
                  <Route path="/security" element={<PublicLayout><SecurityPage /></PublicLayout>} />
                  
                  {/* Auth */}
                  <Route path="/auth" element={<Auth />} />
                  
                  {/* Onboarding */}
                  <Route path="/onboarding/organization" element={
                    <ProtectedRoute>
                      <OrganizationOnboarding />
                    </ProtectedRoute>
                  } />
                  
                  {/* Super Admin */}
                  <Route path="/admin/platform" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <SuperAdminDashboard />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/docs" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <DocsPage />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/organizations" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <AdminOrganizations />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/client-portals" element={
                    <ProtectedRoute>
                      <AppLayout>
                        <ClientPortalManagement />
                      </AppLayout>
                    </ProtectedRoute>
                  } />
                  
                  {/* Protected app routes */}
                  <Route path="/organization/settings" element={<ProtectedRoute><AppLayout><OrganizationSettings /></AppLayout></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
                  <Route path="/projects" element={<ProtectedRoute><AppLayout><Projects /></AppLayout></ProtectedRoute>} />
                  <Route path="/locations" element={<ProtectedRoute><AppLayout><Locations /></AppLayout></ProtectedRoute>} />
                  <Route path="/clients" element={<ProtectedRoute><AppLayout><Clients /></AppLayout></ProtectedRoute>} />
                  <Route path="/service-requests" element={<ProtectedRoute><AppLayout><ServiceRequests /></AppLayout></ProtectedRoute>} />
                  <Route path="/employees" element={<ProtectedRoute><AppLayout><Employees /></AppLayout></ProtectedRoute>} />
                  <Route path="/work-orders" element={<ProtectedRoute><AppLayout><WorkOrders /></AppLayout></ProtectedRoute>} />
                  <Route path="/contracts" element={<ProtectedRoute><AppLayout><Contracts /></AppLayout></ProtectedRoute>} />
                  <Route path="/maintenance" element={<ProtectedRoute><AppLayout><Maintenance /></AppLayout></ProtectedRoute>} />
                  <Route path="/scheduling" element={<ProtectedRoute><AppLayout><Scheduling /></AppLayout></ProtectedRoute>} />
                  <Route path="/field-operations" element={<ProtectedRoute><AppLayout><FieldOperations /></AppLayout></ProtectedRoute>} />
                  <Route path="/quality-assurance" element={<ProtectedRoute><AppLayout><QualityAssurance /></AppLayout></ProtectedRoute>} />
                  <Route path="/advanced-features" element={<ProtectedRoute><AppLayout><AdvancedFeatures /></AppLayout></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
                  <Route path="/integrations" element={<ProtectedRoute><AppLayout><Integrations /></AppLayout></ProtectedRoute>} />
                  <Route path="/communications" element={<ProtectedRoute><AppLayout><Communications /></AppLayout></ProtectedRoute>} />
                  <Route path="/twilio-settings" element={<ProtectedRoute><AppLayout><TwilioSettings /></AppLayout></ProtectedRoute>} />
                  <Route path="/user-management" element={<ProtectedRoute><AppLayout><UserManagement /></AppLayout></ProtectedRoute>} />
                  <Route path="/procurement" element={<ProtectedRoute><AppLayout><Procurement /></AppLayout></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><AppLayout><Profile /></AppLayout></ProtectedRoute>} />
                  <Route path="/floor-plan-editor" element={<ProtectedRoute><FloorPlanEditor /></ProtectedRoute>} />
                  <Route path="/client-locations/:locationId" element={<ProtectedRoute><AppLayout><ClientLocationDetail /></AppLayout></ProtectedRoute>} />
                  <Route path="/service-request-history" element={<ProtectedRoute><AppLayout><ServiceRequestHistory /></AppLayout></ProtectedRoute>} />
                  <Route path="/tradetube" element={<ProtectedRoute><AppLayout><TradeTube /></AppLayout></ProtectedRoute>} />
                  <Route path="/invoices" element={<ProtectedRoute><AppLayout><Invoices /></AppLayout></ProtectedRoute>} />
                  <Route path="/quotes" element={<ProtectedRoute><AppLayout><Quotes /></AppLayout></ProtectedRoute>} />
                  <Route path="/expenses" element={<ProtectedRoute><AppLayout><Expenses /></AppLayout></ProtectedRoute>} />
                  
                  {/* Portal entry */}
                  <Route path="/p/:orgSlug" element={<PortalEntry />} />
                  
                  {/* Catch-all */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </AnalyticsProvider>
              </BrowserRouter>
            </TooltipProvider>
          </OrganizationProvider>
        </OfflineSyncProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
