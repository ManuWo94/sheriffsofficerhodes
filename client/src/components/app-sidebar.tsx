import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard, 
  FolderOpen, 
  Users, 
  Lock, 
  DollarSign, 
  ScrollText, 
  Target, 
  UserCog, 
  StickyNote, 
  FileText,
  LogOut 
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import sheriffBadge from "@assets/ChatGPT Image 19. Nov. 2025, 23_24_49_1763772642626.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Fallakten", url: "/cases", icon: FolderOpen },
  { title: "Personenakte", url: "/persons", icon: Users },
  { title: "Gefängnis", url: "/jail", icon: Lock },
  { title: "Bußgelder", url: "/fines", icon: DollarSign },
  { title: "Stadtgesetze", url: "/laws", icon: ScrollText },
  { title: "Waffenverwaltung", url: "/weapons", icon: Target },
  { title: "Personal", url: "/personnel", icon: UserCog },
  { title: "Notizen", url: "/notes", icon: StickyNote },
  { title: "Protokoll", url: "/audit", icon: FileText },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarContent className="bg-sidebar">
        <div className="flex items-center justify-center py-8 px-4">
          <img 
            src={sheriffBadge} 
            alt="Sheriff's Office Rhodes Badge" 
            className="w-32 h-32 object-contain"
          />
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 font-serif text-sm tracking-wide">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border bg-sidebar p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="text-username">
                {user?.username}
              </p>
              <Badge variant="secondary" className="text-xs mt-1" data-testid="text-rank">
                {user?.rank}
              </Badge>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full" 
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Abmelden
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
