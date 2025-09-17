import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface DropPointType {
  value: string;
  label: string;
  icon: string;
  description?: string;
  isDefault: boolean;
}

const DEFAULT_TYPES: DropPointType[] = [
  { value: "data", label: "Data Port", icon: "🔌", description: "Standard network data port", isDefault: true },
  { value: "fiber", label: "Fiber Optic", icon: "💡", description: "Fiber optic connection point", isDefault: true },
  { value: "security", label: "Security Camera", icon: "🔒", description: "Security camera installation point", isDefault: true },
  { value: "wireless", label: "Wireless Access Point", icon: "📶", description: "WiFi access point location", isDefault: true },
  { value: "power", label: "Power Outlet", icon: "⚡", description: "Electrical power outlet", isDefault: true },
];

export const DropPointTypesManager = () => {
  const [types, setTypes] = useState<DropPointType[]>(DEFAULT_TYPES);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [newType, setNewType] = useState({ value: "", label: "", icon: "", description: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  // Load custom types from localStorage on mount
  useEffect(() => {
    const savedTypes = localStorage.getItem('custom-drop-point-types');
    if (savedTypes) {
      try {
        const customTypes = JSON.parse(savedTypes);
        setTypes([...DEFAULT_TYPES, ...customTypes]);
      } catch (error) {
        console.error("Failed to load custom drop point types:", error);
      }
    }
  }, []);

  const saveCustomTypes = (updatedTypes: DropPointType[]) => {
    const customTypes = updatedTypes.filter(type => !type.isDefault);
    localStorage.setItem('custom-drop-point-types', JSON.stringify(customTypes));
  };

  const handleAddType = () => {
    if (!newType.value || !newType.label || !newType.icon) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (types.some(type => type.value === newType.value)) {
      toast({
        title: "Error",
        description: "A drop point type with this value already exists",
        variant: "destructive",
      });
      return;
    }

    const updatedTypes = [...types, { ...newType, isDefault: false }];
    setTypes(updatedTypes);
    saveCustomTypes(updatedTypes);
    setNewType({ value: "", label: "", icon: "", description: "" });
    setShowAddForm(false);
    toast({
      title: "Success",
      description: "Drop point type added successfully",
    });
  };

  const handleEditType = (typeValue: string, updates: Partial<DropPointType>) => {
    const updatedTypes = types.map(type => 
      type.value === typeValue ? { ...type, ...updates } : type
    );
    setTypes(updatedTypes);
    saveCustomTypes(updatedTypes);
    setEditingType(null);
    toast({
      title: "Success",
      description: "Drop point type updated successfully",
    });
  };

  const handleDeleteType = (typeValue: string) => {
    const typeToDelete = types.find(type => type.value === typeValue);
    if (typeToDelete?.isDefault) {
      toast({
        title: "Error",
        description: "Cannot delete default drop point types",
        variant: "destructive",
      });
      return;
    }

    const updatedTypes = types.filter(type => type.value !== typeValue);
    setTypes(updatedTypes);
    saveCustomTypes(updatedTypes);
    toast({
      title: "Success",
      description: "Drop point type deleted successfully",
    });
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Drop Point Types Configuration
            </CardTitle>
            <CardDescription>
              Manage available drop point types for your organization. Custom types will be available when creating new drop points.
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-primary hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Type
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add New Type Form */}
        {showAddForm && (
          <Card className="border-dashed">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Value (ID)</label>
                  <Input
                    value={newType.value}
                    onChange={(e) => setNewType(prev => ({ ...prev, value: e.target.value.toLowerCase().replace(/\s+/g, '_') }))}
                    placeholder="e.g., voip_phone"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Display Label</label>
                  <Input
                    value={newType.label}
                    onChange={(e) => setNewType(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g., VoIP Phone"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Icon (Emoji)</label>
                  <Input
                    value={newType.icon}
                    onChange={(e) => setNewType(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="📞"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Input
                    value={newType.description}
                    onChange={(e) => setNewType(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleAddType} size="sm" className="bg-gradient-primary">
                  <Save className="h-4 w-4 mr-2" />
                  Add Type
                </Button>
                <Button 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewType({ value: "", label: "", icon: "", description: "" });
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Types List */}
        <div className="grid gap-3">
          {types.map((type) => (
            <div key={type.value} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{type.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{type.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {type.value}
                    </Badge>
                    {type.isDefault && (
                      <Badge variant="outline" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  {type.description && (
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {!type.isDefault && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingType(type.value)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteType(type.value)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {types.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No drop point types configured.</p>
            <p className="text-sm">Add your first custom type to get started.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
