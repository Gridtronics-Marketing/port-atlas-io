import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ClientPortalSidebar } from "@/components/ClientPortalSidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import { ViewAsDropdown } from "@/components/ViewAsDropdown";
import { NotificationBell } from "@/components/NotificationBell";
import { useOrganization } from "@/contexts/OrganizationContext";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { signOut } = useAuth();
  const { isImpersonating, isClientPortalUser } = useOrganization();

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full ${isImpersonating ? 'pt-10' : ''}`}>
        {isClientPortalUser ? <ClientPortalSidebar /> : <AppSidebar />}
        
        <div className="flex-1 flex flex-col">
          {/* Header with sidebar trigger */}
          <header className="h-16 md:h-14 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-10 w-10 md:h-9 md:w-9" />
              <OrganizationSwitcher />
            </div>
            
            {/* App name on mobile when sidebar closed */}
            <div className="flex-1 text-center md:hidden">
              <span className="text-sm font-semibold text-foreground">Trade Atlas</span>
            </div>
            
            <div className="flex-1 hidden md:block" />
            
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ViewAsDropdown />
              <OfflineIndicator />
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="h-10 w-10 md:h-9 md:w-auto md:px-3"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5 md:h-4 md:w-4" />
                <span className="ml-2 hidden md:inline">Sign Out</span>
              </Button>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}