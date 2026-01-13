import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Cog, Database, FileText, Wrench, Network, Shield, Workflow, Key, Info, Mail } from 'lucide-react';
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
import { APIKeysManager } from '@/components/APIKeysManager';
import { VersionInfo } from '@/components/VersionInfo';
import { EmailBrandingSettings } from '@/components/EmailBrandingSettings';
import { useSearchParams } from 'react-router-dom';
import { useOrganization } from '@/contexts/OrganizationContext';

const Settings = () => {
  const [searchParams] = useSearchParams();
  const { isSuperAdmin } = useOrganization();
  const defaultTab = searchParams.get('tab') || 'core';
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

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 gap-2 h-auto p-1">
          <TabsTrigger value="core" className="flex flex-col gap-1 h-auto py-3">
            <Cog className="h-5 w-5" />
            <span className="text-xs">Core Configuration</span>
          </TabsTrigger>
          <TabsTrigger value="business" className="flex flex-col gap-1 h-auto py-3">
            <FileText className="h-5 w-5" />
            <span className="text-xs">Business Management</span>
          </TabsTrigger>
          <TabsTrigger value="infrastructure" className="flex flex-col gap-1 h-auto py-3">
            <Network className="h-5 w-5" />
            <span className="text-xs">Infrastructure</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex flex-col gap-1 h-auto py-3">
            <Shield className="h-5 w-5" />
            <span className="text-xs">Security & Operations</span>
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="flex flex-col gap-1 h-auto py-3">
            <Key className="h-5 w-5" />
            <span className="text-xs">API Keys</span>
          </TabsTrigger>
          {isSuperAdmin && (
            <TabsTrigger value="email-branding" className="flex flex-col gap-1 h-auto py-3">
              <Mail className="h-5 w-5" />
              <span className="text-xs">Email Branding</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="about" className="flex flex-col gap-1 h-auto py-3">
            <Info className="h-5 w-5" />
            <span className="text-xs">About</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="core" className="space-y-6">
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

        <TabsContent value="business" className="space-y-6">
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
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">Contract Categories:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>contract_type</strong> - Types of contracts</li>
                  <li>• <strong>billing_frequency</strong> - Billing frequencies</li>
                </ul>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">Maintenance Categories:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• <strong>service_frequency</strong> - Service frequencies</li>
                  <li>• <strong>maintenance_type</strong> - Maintenance types</li>
                  <li>• <strong>equipment_category</strong> - Equipment categories</li>
                </ul>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="infrastructure" className="space-y-6">
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

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Permissions</CardTitle>
                <CardDescription>
                  Configure granular permissions and access control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <GranularPermissionsManager />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Compliance Standards</CardTitle>
                <CardDescription>
                  Configure BICSI, TIA, ISO standards and documentation requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComplianceStandardsSettings />
              </CardContent>
            </Card>

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

            <Card>
              <CardHeader>
                <CardTitle>Notification Templates</CardTitle>
                <CardDescription>
                  Configure email and SMS notification templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationTemplatesManager />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Diagnostics</CardTitle>
                <CardDescription>
                  View system logs and audit trail
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AuditTrailViewer />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>External API Keys</CardTitle>
              <CardDescription>
                Configure API keys for Google Maps and other external services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <APIKeysManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          <VersionInfo />
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="email-branding" className="space-y-6">
            <EmailBrandingSettings />
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
};

export default Settings;