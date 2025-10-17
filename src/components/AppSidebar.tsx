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
  Info
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
import { useUserRoles } from "@/hooks/useUserRoles";
import portAtlasLogo from "@/assets/port-atlas-logo.png";
import { PWAInstallButton } from "@/components/PWAInstallButton";
import { Separator } from "@/components/ui/separator";
import { APP_VERSION } from "@/lib/version";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Work Orders", url: "/work-orders", icon: ClipboardList },
  { title: "Procurement", url: "/procurement", icon: Package },
  { title: "Contracts", url: "/contracts", icon: FileText },
  { title: "Maintenance", url: "/maintenance", icon: Wrench },
  { title: "Scheduling", url: "/scheduling", icon: Calendar },
  { title: "Field Operations", url: "/field-operations", icon: MapPin },
  { title: "Quality Assurance", url: "/quality-assurance", icon: Shield },
  { title: "Advanced Features", url: "/advanced-features", icon: Settings },
  { title: "System Settings", url: "/settings", icon: Settings },
  { title: "Communications", url: "/communications", icon: MessageSquare },
  { title: "Integrations", url: "/integrations", icon: Zap },
  { title: "Twilio Settings", url: "/twilio-settings", icon: Phone },
  { title: "Locations", url: "/locations", icon: Building },
  { title: "Clients", url: "/clients", icon: Building },
  { title: "Employees", url: "/employees", icon: Users },
];

export function AppSidebar() {
  const { state, setOpen } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { hasRole } = useUserRoles();
  const isMobile = useIsMobile();
  
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";

  // Auto-close sidebar on navigation (mobile only)
  const handleNavClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };
  
  // Add admin-only items
  const allItems = hasRole('admin') 
    ? [...navigationItems, { title: "User Management", url: "/user-management", icon: UserCog }]
    : navigationItems;

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
            src={portAtlasLogo} 
            alt="Port Atlas" 
            className="h-8 w-8 flex-shrink-0"
          />
          {!isCollapsed && (
            <span className="text-lg font-bold text-foreground">
              Port Atlas
            </span>
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
              {allItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url}
                      onClick={handleNavClick}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${getNavClassName(item.url)}`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        {/* PWA Install Button */}
        <div className={`${isCollapsed ? "flex justify-center" : ""} mb-2`}>
          <PWAInstallButton 
            variant="outline" 
            size={isCollapsed ? "icon" : "default"}
            showLabel={!isCollapsed}
            className="w-full"
          />
        </div>
        
        {/* Build Version - Clickable to view changelog */}
        <NavLink 
          to="/settings?tab=about" 
          className={`${isCollapsed ? "text-center" : ""} mb-2 block hover:text-primary transition-colors`}
          title="View changelog"
        >
          <p className="text-xs text-muted-foreground/60 hover:text-muted-foreground">
            {isCollapsed ? `v${APP_VERSION.split('.').slice(0, 2).join('.')}` : `Version ${APP_VERSION}`}
          </p>
        </NavLink>
        
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
            <DropdownMenuItem asChild>
              <NavLink to="/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </NavLink>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <NavLink to="/settings?tab=about" className="flex items-center">
                <Info className="mr-2 h-4 w-4" />
                <span>About & Changelog</span>
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