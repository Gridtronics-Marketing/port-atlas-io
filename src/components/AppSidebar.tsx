import { 
  Home, 
  ClipboardList, 
  MapPin, 
  Shield, 
  Settings, 
  Zap, 
  Building, 
  Users, 
  UserCog,
  User,
  LogOut,
  FolderOpen,
  Calendar,
  MessageSquare,
  Phone,
  FileText,
  Wrench,
  Package,
  Info,
  Building2,
  PlayCircle,
  LayoutDashboard,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Layers,
  Database,
  BookOpen
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { useOrganization } from "@/contexts/OrganizationContext";
import tradeAtlasLogo from "@/assets/trade-atlas-logo.png";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { Separator } from "@/components/ui/separator";
import { APP_VERSION } from "@/lib/version";
import { cn } from "@/lib/utils";

// Organized navigation structure with groups
const navigationGroups = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Jobs", url: "/projects", icon: FolderOpen },
      { title: "Work Orders", url: "/work-orders", icon: ClipboardList },
    ]
  },
  {
    label: "Operations",
    items: [
      { title: "Locations", url: "/locations", icon: MapPin },
      { title: "Scheduling", url: "/scheduling", icon: Calendar },
      { title: "Field Operations", url: "/field-operations", icon: Briefcase },
      { title: "Maintenance", url: "/maintenance", icon: Wrench },
    ]
  },
  {
    label: "Business",
    items: [
      { title: "Clients", url: "/clients", icon: Building },
      { title: "Contracts", url: "/contracts", icon: FileText },
      { title: "Procurement", url: "/procurement", icon: Package },
      { title: "Service Requests", url: "/service-requests", icon: MessageSquare },
    ]
  },
  {
    label: "Resources",
    items: [
      { title: "TradeTube", url: "/tradetube", icon: PlayCircle },
      { title: "Communications", url: "/communications", icon: MessageSquare },
      { title: "Quality Assurance", url: "/quality-assurance", icon: Shield },
    ]
  },
  {
    label: "Settings",
    items: [
      { title: "System Settings", url: "/settings", icon: Settings },
      { title: "Integrations", url: "/integrations", icon: Zap },
      { title: "Twilio Settings", url: "/twilio-settings", icon: Phone },
      { title: "Advanced Features", url: "/advanced-features", icon: Layers },
    ]
  }
];

export function AppSidebar() {
  const { state, setOpenMobile } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { hasRole } = useUserRoles();
  const { isSuperAdmin, loadingOrganizations } = useOrganization();
  const isMobile = useIsMobile();
  
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";

  // Auto-close sidebar on navigation (mobile only)
  const handleNavClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };
  
  // Build admin groups - wait for loading to complete to avoid flicker
  const adminGroup = !loadingOrganizations && (hasRole('admin') || isSuperAdmin) ? {
    label: "Administration",
    items: [
      ...(hasRole('admin') ? [{ title: "User Management", url: "/user-management", icon: UserCog }] : []),
      ...(isSuperAdmin ? [
        { title: "Organizations", url: "/admin/organizations", icon: Building2 },
        { title: "Client Portals", url: "/admin/client-portals", icon: Database },
        { title: "PRD & Docs", url: "/docs", icon: BookOpen },
      ] : [])
    ]
  } : null;

  const allGroups = adminGroup ? [...navigationGroups, adminGroup] : navigationGroups;

  return (
    <Sidebar 
      className={cn(
        "border-r bg-sidebar transition-all duration-300",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo Header */}
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <NavLink to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <img 
              src={tradeAtlasLogo} 
              alt="Trade Atlas" 
              className="h-6 w-6"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-foreground truncate">
                Trade Atlas
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Dashboard
              </span>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="overflow-hidden">
        <ScrollArea className="flex-1 min-h-0 h-full">
          <div className="py-2">
            {allGroups.map((group, groupIndex) => (
              <SidebarGroup key={group.label} className="py-2">
                {!isCollapsed && (
                  <SidebarGroupLabel className="px-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
                    {group.label}
                  </SidebarGroupLabel>
                )}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {group.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className="px-0">
                          <NavLink 
                            to={item.url}
                            onClick={handleNavClick}
                            className={cn(
                              "flex items-center gap-3 px-4 py-2 mx-2 rounded-md transition-all duration-150",
                              isActive(item.url) 
                                ? "bg-primary/10 text-primary font-medium shadow-sm" 
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            )}
                            title={isCollapsed ? item.title : undefined}
                          >
                            <item.icon className={cn(
                              "h-4 w-4 flex-shrink-0",
                              isActive(item.url) ? "text-primary" : "text-muted-foreground"
                            )} />
                            {!isCollapsed && (
                              <span className="text-sm truncate">{item.title}</span>
                            )}
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
                {groupIndex < allGroups.length - 1 && !isCollapsed && (
                  <Separator className="mt-3 mx-4 bg-sidebar-border/50" />
                )}
              </SidebarGroup>
            ))}
          </div>
        </ScrollArea>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="p-3 border-t border-sidebar-border mt-auto">
        {/* PWA Install Button */}
        <div className={cn("mb-2", isCollapsed && "flex justify-center")}>
          <PWAInstallButton 
            variant="ghost" 
            size={isCollapsed ? "icon" : "sm"}
            showLabel={!isCollapsed}
            className={cn(
              "h-8 text-xs text-muted-foreground hover:text-foreground",
              !isCollapsed && "w-full justify-start"
            )}
          />
        </div>
        
        {/* Build Version */}
        <NavLink 
          to="/settings?tab=about" 
          className={cn(
            "block mb-3 text-center hover:text-primary transition-colors",
            isCollapsed && "text-center"
          )}
          title="View changelog"
        >
          <p className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground">
            {isCollapsed ? `v${APP_VERSION.split('.').slice(0, 2).join('.')}` : `Version ${APP_VERSION}`}
          </p>
        </NavLink>
        
        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "relative h-auto py-2",
                isCollapsed ? "h-10 w-10 p-0 mx-auto" : "w-full justify-start px-2"
              )}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src="/avatars/user.jpg" alt="User" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="ml-2 text-left flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="start" forceMount>
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
              <NavLink to="/profile" className="flex items-center cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <NavLink to="/settings" className="flex items-center cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <NavLink to="/settings?tab=about" className="flex items-center cursor-pointer">
                <Info className="mr-2 h-4 w-4" />
                <span>About & Changelog</span>
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}