import { useState } from "react";
import { Plus, MapPin, Users, Building2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LocationGrid } from "@/components/LocationGrid";
import { StatsOverview } from "@/components/StatsOverview";
import { RecentActivity } from "@/components/RecentActivity";
import { AddLocationModal } from "@/components/AddLocationModal";
import { Navigation } from "@/components/Navigation";
import { SeedDataButton } from "@/components/SeedDataButton";

const Index = () => {
  const [showAddLocation, setShowAddLocation] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <SeedDataButton />
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Jobsite Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Track installations, manage clients, and monitor project progress
            </p>
          </div>
          
          <Button 
            onClick={() => setShowAddLocation(true)}
            className="bg-gradient-primary hover:bg-primary-hover shadow-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Location
          </Button>
        </div>

        {/* Stats Overview */}
        <StatsOverview />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Locations */}
          <div className="lg:col-span-2">
            <Card className="shadow-soft">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Active Locations
                  </CardTitle>
                  <CardDescription>
                    Manage installation sites and client locations
                  </CardDescription>
                </div>
                <Badge variant="secondary">12 Active</Badge>
              </CardHeader>
              <CardContent>
                <LocationGrid />
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentActivity />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Location Modal */}
        <AddLocationModal 
          open={showAddLocation} 
          onOpenChange={setShowAddLocation} 
        />
      </main>
    </div>
  );
};

export default Index;