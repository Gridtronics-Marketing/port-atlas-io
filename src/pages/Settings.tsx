import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cog, Database, Workflow, Bell, Shield, Network, Activity, FileCheck, QrCode } from 'lucide-react';
import { DropPointTypesManager } from '@/components/DropPointTypesManager';
import { CameraPermissionTest } from '@/components/CameraPermissionTest';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SystemConfigurationManager } from '@/components/SystemConfigurationManager';
import { DropdownOptionsManager } from '@/components/DropdownOptionsManager';
import { WorkflowConfigurationManager } from '@/components/WorkflowConfigurationManager';
import { NotificationTemplatesManager } from '@/components/NotificationTemplatesManager';
import { RiserDiagramSettingsManager } from '@/components/RiserDiagramSettingsManager';
import { NetworkInfrastructureSettingsManager } from '@/components/NetworkInfrastructureSettingsManager';
import { CapacityManagementSettings } from '@/components/CapacityManagementSettings';
import { ComplianceStandardsSettings } from '@/components/ComplianceStandardsSettings';
import { WorkOrderIntegrationSettings } from '@/components/WorkOrderIntegrationSettings';

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
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
          <TabsTrigger value="dropdown-options" className="text-xs">
            <Database className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Dropdown</span>
          </TabsTrigger>
          <TabsTrigger value="system-config" className="text-xs">
            <Cog className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">System</span>
          </TabsTrigger>
          <TabsTrigger value="riser-diagrams" className="text-xs">
            <Network className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Riser</span>
          </TabsTrigger>
          <TabsTrigger value="network-infrastructure" className="text-xs">
            <Activity className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Network</span>
          </TabsTrigger>
          <TabsTrigger value="capacity-management" className="text-xs">
            <Shield className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Capacity</span>
          </TabsTrigger>
          <TabsTrigger value="compliance" className="text-xs">
            <FileCheck className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Compliance</span>
          </TabsTrigger>
          <TabsTrigger value="work-orders" className="text-xs">
            <QrCode className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Work Orders</span>
          </TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs">
            <Workflow className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Workflows</span>
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
                <WorkflowConfigurationManager />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="riser-diagrams" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Riser Diagram Settings</CardTitle>
                <CardDescription>
                  Configure visual preferences, refresh intervals, and cable labeling formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RiserDiagramSettingsManager />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="network-infrastructure" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Network Infrastructure Settings</CardTitle>
                <CardDescription>
                  Configure device discovery, monitoring intervals, and PoE management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NetworkInfrastructureSettingsManager />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="capacity-management" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Capacity Management Settings</CardTitle>
                <CardDescription>
                  Configure alert thresholds and utilization monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CapacityManagementSettings />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Standards Settings</CardTitle>
                <CardDescription>
                  Configure BICSI, TIA, ISO standards and documentation requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComplianceStandardsSettings />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="work-orders" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Work Order Integration Settings</CardTitle>
                <CardDescription>
                  Configure QR code generation, auto-linking, and MAC tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WorkOrderIntegrationSettings />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Settings;