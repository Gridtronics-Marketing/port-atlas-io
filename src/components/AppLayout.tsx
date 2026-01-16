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
      <div className={`min-h-screen flex w-full overflow-x-hidden ${isImpersonating ? 'pt-10' : ''}`}>
        {isClientPortalUser ? <ClientPortalSidebar /> : <AppSidebar />}
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header with sidebar trigger */}
          <header className="h-14 flex items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-4">
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-shrink">
              <SidebarTrigger className="h-11 w-11 min-w-[44px] min-h-[44px] flex-shrink-0" />
              <OrganizationSwitcher />
            </div>
            
            <div className="flex-1 hidden md:block" />
            
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              <NotificationBell />
              <ViewAsDropdown />
              <OfflineIndicator />
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="h-9 w-9"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
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