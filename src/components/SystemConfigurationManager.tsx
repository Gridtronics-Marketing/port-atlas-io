import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useSystemConfigurations } from '@/hooks/useSystemConfigurations';
import { SystemConfigurationForm } from './SystemConfigurationForm';

export const SystemConfigurationManager = () => {
  const { configurations, loading, deleteConfiguration } = useSystemConfigurations();
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
    return <div className="text-center">Loading configurations...</div>;
  }

  // Group configurations by category
  const configsByCategory = configurations.reduce((acc, config) => {
    if (!acc[config.category]) {
      acc[config.category] = [];
    }
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, typeof configurations>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">System Configurations</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Configuration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedConfig ? 'Edit Configuration' : 'Add Configuration'}
              </DialogTitle>
            </DialogHeader>
            <SystemConfigurationForm 
              configuration={selectedConfig} 
              onClose={handleClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {Object.entries(configsByCategory).map(([category, configs]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize">{category.replace('_', ' ')}</CardTitle>
              <CardDescription>
                Configuration settings for {category.replace('_', ' ')} category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{config.key}</h4>
                        <Badge variant="outline" className="text-xs">
                          {config.data_type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {config.description}
                      </p>
                      <p className="text-sm font-mono bg-background px-2 py-1 rounded">
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
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {Object.keys(configsByCategory).length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No configurations found. Add your first configuration to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};