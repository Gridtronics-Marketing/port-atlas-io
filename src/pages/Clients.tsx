import { useState } from "react";
import { Users, Plus, Building2, Phone, Mail, MapPin, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Navigation } from "@/components/Navigation";

const mockClients = [
  {
    id: 1,
    name: "TechCorp Inc.",
    contact: "John Smith",
    email: "john.smith@techcorp.com",
    phone: "(555) 123-4567",
    locations: 3,
    activeProjects: 2,
    status: "Active",
    joinDate: "2023-08-15",
    avatar: "/avatars/techcorp.jpg",
    initials: "TC",
  },
  {
    id: 2,
    name: "Industrial Solutions",
    contact: "Sarah Johnson",
    email: "s.johnson@industrial.com",
    phone: "(555) 234-5678",
    locations: 2,
    activeProjects: 1,
    status: "Active",
    joinDate: "2023-09-22",
    avatar: "/avatars/industrial.jpg",
    initials: "IS",
  },
  {
    id: 3,
    name: "ShopMart",
    contact: "Mike Wilson",
    email: "mike.w@shopmart.com",
    phone: "(555) 345-6789",
    locations: 5,
    activeProjects: 3,
    status: "Active",
    joinDate: "2023-07-10",
    avatar: "/avatars/shopmart.jpg",
    initials: "SM",
  },
  {
    id: 4,
    name: "Global Enterprises",
    contact: "Lisa Chen",
    email: "lisa.chen@global-ent.com",
    phone: "(555) 456-7890",
    locations: 1,
    activeProjects: 0,
    status: "Completed",
    joinDate: "2023-06-05",
    avatar: "/avatars/global.jpg",
    initials: "GE",
  },
  {
    id: 5,
    name: "Local Business Co.",
    contact: "David Brown",
    email: "d.brown@localbiz.com",
    phone: "(555) 567-8901",
    locations: 1,
    activeProjects: 1,
    status: "Planning",
    joinDate: "2024-01-12",
    avatar: "/avatars/localbiz.jpg",
    initials: "LB",
  },
];

const Clients = () => {
  const [clients, setClients] = useState(mockClients);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success text-success-foreground";
      case "Planning":
        return "bg-warning text-warning-foreground";
      case "Completed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const stats = [
    { label: "Total Clients", value: clients.length.toString(), color: "text-primary" },
    { label: "Active Projects", value: clients.filter(c => c.status === "Active").length.toString(), color: "text-success" },
    { label: "Total Locations", value: clients.reduce((sum, c) => sum + c.locations, 0).toString(), color: "text-warning" },
    { label: "New This Month", value: "2", color: "text-muted-foreground" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Client Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage client relationships, access, and project assignments
            </p>
          </div>
          
          <Button className="bg-gradient-primary hover:bg-primary-hover shadow-medium">
            <Plus className="h-4 w-4 mr-2" />
            Add New Client
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <Users className="h-8 w-8 text-primary opacity-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Clients List */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                All Clients
              </span>
              <Badge variant="secondary">{clients.length} Total</Badge>
            </CardTitle>
            <CardDescription>
              Manage client accounts and project access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-soft transition-all duration-200 bg-card"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={client.avatar} alt={client.name} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {client.initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground text-lg">
                          {client.name}
                        </h3>
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {client.contact}
                          </span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {client.locations} locations
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {client.activeProjects} active projects
                          </span>
                          <span>Joined: {new Date(client.joinDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      View Locations
                    </Button>
                    
                    <Button variant="outline" size="sm">
                      Client Portal
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border">
                        <DropdownMenuItem>
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Manage Access
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Send Message
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          View Reports
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Deactivate Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Clients;