import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cog, Database, Workflow, Bell, Shield, Network, Activity, FileCheck, QrCode, FileText, Wrench } from 'lucide-react';
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
import { GranularPermissionsManager } from '@/components/GranularPermissionsManager';
import { AuditTrailViewer } from '@/components/AuditTrailViewer';

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
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-13 gap-1">
          <TabsTrigger value="dropdown-options" className="text-xs">
            <Database className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Dropdown</span>
          </TabsTrigger>
          <TabsTrigger value="contracts-settings" className="text-xs">
            <FileText className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Contracts</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance-settings" className="text-xs">
            <Wrench className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Maintenance</span>
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
          <TabsTrigger value="permissions" className="text-xs">
            <Shield className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Permissions</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs">
            <Bell className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-xs">
            <Shield className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Diagnostics</span>
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

        <TabsContent value="contracts-settings" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Contract Settings</CardTitle>
                <CardDescription>
                  Configure dropdown options for contract types and billing frequencies used in contract management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DropdownOptionsManager />
              </CardContent>
            </Card>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-2">Available Categories:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>contract_type</strong> - Types of contracts (maintenance, installation, etc.)</li>
                <li>• <strong>billing_frequency</strong> - How often billing occurs (monthly, quarterly, etc.)</li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="maintenance-settings" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Settings</CardTitle>
                <CardDescription>
                  Configure dropdown options for service frequencies and maintenance types used in service planning.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DropdownOptionsManager />
              </CardContent>
            </Card>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-2">Available Categories:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>service_frequency</strong> - How often services are performed (weekly, monthly, etc.)</li>
                <li>• <strong>maintenance_type</strong> - Types of maintenance services available</li>
                <li>• <strong>equipment_category</strong> - Categories for equipment covered in service plans</li>
              </ul>
            </div>
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
      </Tabs>
    </main>
  );
};

export default Settings;