import { ReactNode, createContext, useContext } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ClientPortalSidebar } from "@/components/ClientPortalSidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { OrganizationSwitcher } from "@/components/OrganizationSwitcher";
import { ViewAsDropdown } from "@/components/ViewAsDropdown";
import { NotificationBell } from "@/components/NotificationBell";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

// Context for page title
interface PageHeaderContextType {
  title: string;
  setTitle: (title: string) => void;
  subtitle?: string;
  setSubtitle: (subtitle?: string) => void;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { signOut } = useAuth();
  const { isImpersonating, isClientPortalUser } = useOrganization();
  const { theme, toggleTheme } = useTheme();

  return (
    <SidebarProvider>
      <div className={cn(
        "min-h-screen flex w-full overflow-x-hidden bg-background",
        isImpersonating && "pt-10"
      )}>
        {isClientPortalUser ? <ClientPortalSidebar /> : <AppSidebar />}
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Professional header bar */}
          <header className="sticky top-0 z-40 h-14 flex items-center justify-between border-b bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/60 px-4 lg:px-6 shadow-xs">
            {/* Left section - Menu trigger and organization */}
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" />
              <Separator orientation="vertical" className="h-5 hidden md:block" />
              <div className="hidden md:block">
                <OrganizationSwitcher />
              </div>
            </div>
            
            {/* Right section - Actions */}
            <div className="flex items-center gap-1.5 lg:gap-2">
              <OfflineIndicator />
              <NotificationBell />
              <ViewAsDropdown />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground"
                title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Separator orientation="vertical" className="h-5 mx-1 hidden lg:block" />
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="h-9 px-3 gap-2 text-muted-foreground hover:text-foreground"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden lg:inline text-sm">Sign Out</span>
              </Button>
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden relative">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}