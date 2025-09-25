import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSystemConfigurations } from '@/hooks/useSystemConfigurations';
import { SystemConfigurationForm } from './SystemConfigurationForm';

export const WorkOrderIntegrationSettings = () => {
  const { configurations, loading, deleteConfiguration } = useSystemConfigurations('work_order_integration');
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this configuration?')) {
      await deleteConfiguration(id);
    }
  };

  const handleEdit = (config: any) => {
    setSelectedConfig(config);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedConfig(null);
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setSelectedConfig(null);
  };

  if (loading) {
    return <div className="text-center">Loading work order integration settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Work Order Integration Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure QR code generation, auto-linking features, and MAC address tracking
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Setting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedConfig ? 'Edit Integration Setting' : 'Add Integration Setting'}
              </DialogTitle>
            </DialogHeader>
            <SystemConfigurationForm 
              configuration={selectedConfig} 
              onClose={handleClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {configurations.map((config) => (
          <Card key={config.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{config.key}</h4>
                    <Badge variant="outline" className="text-xs">
                      {config.data_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {config.description}
                  </p>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                    {config.value}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(config)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(config.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {configurations.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No work order integration settings configured. Add settings to enable QR codes and automated work order features.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};