import { 
  Home, 
  MapPin, 
  FolderOpen,
  MessageSquare,
  User,
  LogOut,
  Settings,
  Info,
  History
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { NavLink, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import tradeAtlasLogo from "@/assets/trade-atlas-logo.png";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { Separator } from "@/components/ui/separator";
import { APP_VERSION } from "@/lib/version";

const clientNavigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "My Locations", url: "/locations", icon: MapPin },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Service Requests", url: "/service-requests", icon: MessageSquare },
  { title: "Request History", url: "/service-request-history", icon: History },
];

export function ClientPortalSidebar() {
  const { state, setOpen } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { currentOrganization } = useOrganization();
  const isMobile = useIsMobile();
  
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";

  const handleNavClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };

  const getNavClassName = (path: string) => {
    return isActive(path) 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";
  };

  return (
    <Sidebar className={`${isCollapsed ? "w-16" : "w-64"} border-r transition-all duration-300`}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img 
            src={tradeAtlasLogo} 
            alt="Trade Atlas" 
            className="h-8 w-8 flex-shrink-0"
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">
                Client Portal
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                {currentOrganization?.name}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {clientNavigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-3 py-3 md:py-2 rounded-lg transition-colors ${getNavClassName(item.url)}`}
                    >
                      <item.icon className="h-5 w-5 md:h-4 md:w-4 flex-shrink-0" />
                      {!isCollapsed && <span className="text-sm md:text-base">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className={`${isCollapsed ? "flex justify-center" : ""} mb-2`}>
          <PWAInstallButton 
            variant="outline" 
            size={isCollapsed ? "icon" : "default"}
            showLabel={!isCollapsed}
            className="w-full"
          />
        </div>
        
        <div className={`${isCollapsed ? "text-center" : ""} mb-2`}>
          <p className="text-xs text-muted-foreground/60">
            {isCollapsed ? `v${APP_VERSION.split('.').slice(0, 2).join('.')}` : `Version ${APP_VERSION}`}
          </p>
        </div>
        
        <Separator className="mb-4" />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={`${isCollapsed ? "h-10 w-10 p-0" : "w-full justify-start"} relative`}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/user.jpg" alt="User" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="ml-3 text-left flex-1">
                  <p className="text-sm font-medium">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-popover border" align="start" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <NavLink to="/profile" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
