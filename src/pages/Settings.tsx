import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cog, Database, Workflow, Bell, Shield } from 'lucide-react';
import { DropPointTypesManager } from '@/components/DropPointTypesManager';
import { CameraPermissionTest } from '@/components/CameraPermissionTest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemConfigurationManager } from '@/components/SystemConfigurationManager';
import { DropdownOptionsManager } from '@/components/DropdownOptionsManager';

const Settings = () => {
  return (
    <main className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent">
          System Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Centralized configuration management for all system settings and dropdown options
        </p>
      </div>

      <Tabs defaultValue="dropdown-options" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dropdown-options">
            <Database className="h-4 w-4 mr-2" />
            Dropdown Options
          </TabsTrigger>
          <TabsTrigger value="system-config">
            <Cog className="h-4 w-4 mr-2" />
            System Config
          </TabsTrigger>
          <TabsTrigger value="workflows">
            <Workflow className="h-4 w-4 mr-2" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="diagnostics">
            <Shield className="h-4 w-4 mr-2" />
            Diagnostics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dropdown-options" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dropdown Options Management</CardTitle>
                <CardDescription>
                  Configure all dropdown values used throughout the application. Add, edit, or remove options for various categories.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DropdownOptionsManager />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="system-config" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Manage general system settings and configuration values
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemConfigurationManager />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="workflows" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Configuration</CardTitle>
                <CardDescription>
                  Configure business processes and approval workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Workflow configuration coming soon...</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Templates</CardTitle>
                <CardDescription>
                  Configure notification messages and templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Notification templates coming soon...</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="diagnostics" className="space-y-6">
          <DropPointTypesManager />
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Camera Diagnostics</CardTitle>
                <CardDescription>
                  Test camera permissions and functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CameraPermissionTest />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Settings;