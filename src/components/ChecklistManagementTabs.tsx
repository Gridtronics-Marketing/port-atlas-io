import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Shield, 
  CheckSquare, 
  Settings, 
  Trash2, 
  Edit,
  Eye,
  EyeOff 
} from 'lucide-react';
import { useChecklistManagement } from '@/hooks/useChecklistManagement';
import { useUserRoles } from '@/hooks/useUserRoles';
import { CreateSafetyChecklistModal } from '@/components/CreateSafetyChecklistModal';
import { CreateQualityChecklistModal } from '@/components/CreateQualityChecklistModal';

export const ChecklistManagementTabs: React.FC = () => {
  const { 
    safetyChecklists, 
    qualityChecklists, 
    loading,
    deleteSafetyChecklist,
    deleteQualityChecklist,
    updateSafetyChecklist,
    updateQualityChecklist 
  } = useChecklistManagement();
  
  const { hasRole } = useUserRoles();
  const [showCreateSafetyModal, setShowCreateSafetyModal] = useState(false);
  const [showCreateQualityModal, setShowCreateQualityModal] = useState(false);

  const isAdmin = hasRole('admin') || hasRole('hr_manager');

  const toggleChecklistStatus = async (type: 'safety' | 'quality', id: string, currentStatus: boolean) => {
    if (type === 'safety') {
      await updateSafetyChecklist(id, { is_active: !currentStatus });
    } else {
      await updateQualityChecklist(id, { is_active: !currentStatus });
    }
  };

  const handleDelete = async (type: 'safety' | 'quality', id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the checklist "${name}"? This action cannot be undone.`)) {
      if (type === 'safety') {
        await deleteSafetyChecklist(id);
      } else {
        await deleteQualityChecklist(id);
      }
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pre_job': case 'installation': return 'bg-blue-100 text-blue-800';
      case 'post_job': case 'testing': return 'bg-green-100 text-green-800';
      case 'hazmat': case 'compliance': return 'bg-red-100 text-red-800';
      case 'electrical': case 'performance': return 'bg-yellow-100 text-yellow-800';
      case 'documentation': return 'bg-purple-100 text-purple-800';
      case 'handover': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          Loading checklists...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="safety" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="safety" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Safety Checklists
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Quality Checklists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="safety" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Safety Checklists</h3>
              <p className="text-muted-foreground text-sm">
                Manage safety checklists for field operations
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowCreateSafetyModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Safety Checklist
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            {safetyChecklists.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Safety Checklists</h3>
                  <p className="text-muted-foreground mb-4">
                    {isAdmin 
                      ? "Create your first safety checklist to get started" 
                      : "No safety checklists have been created yet"
                    }
                  </p>
                  {isAdmin && (
                    <Button onClick={() => setShowCreateSafetyModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Checklist
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              safetyChecklists.map((checklist) => (
                <Card key={checklist.id} className={!checklist.is_active ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{checklist.name}</CardTitle>
                          <Badge className={getCategoryColor(checklist.category)}>
                            {checklist.category.replace('_', ' ')}
                          </Badge>
                          {!checklist.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        {checklist.description && (
                          <CardDescription>{checklist.description}</CardDescription>
                        )}
                      </div>
                      
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleChecklistStatus('safety', checklist.id, checklist.is_active)}
                          >
                            {checklist.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete('safety', checklist.id, checklist.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{checklist.items?.length || 0} items</span>
                        <span>{checklist.items?.filter(i => i.is_required).length || 0} required</span>
                      </div>
                      
                      {checklist.items && checklist.items.length > 0 && (
                        <div className="space-y-2">
                          {checklist.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                              <span className="truncate">{item.title}</span>
                              {item.is_required && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                          ))}
                          {checklist.items.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{checklist.items.length - 3} more items
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Quality Checklists</h3>
              <p className="text-muted-foreground text-sm">
                Manage quality assurance checklists for projects
              </p>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowCreateQualityModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Quality Checklist
              </Button>
            )}
          </div>

          <div className="grid gap-4">
            {qualityChecklists.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Quality Checklists</h3>
                  <p className="text-muted-foreground mb-4">
                    {isAdmin 
                      ? "Create your first quality checklist to get started" 
                      : "No quality checklists have been created yet"
                    }
                  </p>
                  {isAdmin && (
                    <Button onClick={() => setShowCreateQualityModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Checklist
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              qualityChecklists.map((checklist) => (
                <Card key={checklist.id} className={!checklist.is_active ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{checklist.name}</CardTitle>
                          <Badge className={getCategoryColor(checklist.category)}>
                            {checklist.category}
                          </Badge>
                          {!checklist.is_active && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                        {checklist.description && (
                          <CardDescription>{checklist.description}</CardDescription>
                        )}
                      </div>
                      
                      {isAdmin && (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleChecklistStatus('quality', checklist.id, checklist.is_active)}
                          >
                            {checklist.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete('quality', checklist.id, checklist.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{checklist.items?.length || 0} items</span>
                        <span>{checklist.items?.filter(i => i.is_required).length || 0} required</span>
                      </div>
                      
                      {checklist.items && checklist.items.length > 0 && (
                        <div className="space-y-2">
                          {checklist.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-sm">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                              <span className="truncate">{item.title}</span>
                              {item.is_required && (
                                <Badge variant="destructive" className="text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                          ))}
                          {checklist.items.length > 3 && (
                            <div className="text-xs text-muted-foreground">
                              +{checklist.items.length - 3} more items
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <CreateSafetyChecklistModal
        open={showCreateSafetyModal}
        onOpenChange={setShowCreateSafetyModal}
      />
      
      <CreateQualityChecklistModal
        open={showCreateQualityModal}
        onOpenChange={setShowCreateQualityModal}
      />
    </div>
  );
};