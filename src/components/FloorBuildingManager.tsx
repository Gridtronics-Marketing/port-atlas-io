import { useState, useEffect } from "react";
import { Building2, Plus, Pencil, Trash2, Layers, Home, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FloorMetadata {
  image_path?: string;
  name?: string;
  type?: "floor" | "outbuilding";
  drawing_data?: string;
}

interface FloorPlanFiles {
  [key: string]: string | FloorMetadata;
}

interface FloorBuildingManagerProps {
  locationId: string;
  locationName: string;
  currentFloors: number;
  floorPlanFiles: FloorPlanFiles | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFloorsUpdated: () => void;
}

export const FloorBuildingManager = ({
  locationId,
  locationName,
  currentFloors,
  floorPlanFiles,
  open,
  onOpenChange,
  onFloorsUpdated,
}: FloorBuildingManagerProps) => {
  const { toast } = useToast();
  const [floors, setFloors] = useState<number>(currentFloors);
  const [floorNames, setFloorNames] = useState<Record<string, string>>({});
  const [outbuildings, setOutbuildings] = useState<{ key: string; name: string }[]>([]);
  const [editingFloor, setEditingFloor] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newOutbuildingName, setNewOutbuildingName] = useState("");
  const [showAddOutbuilding, setShowAddOutbuilding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "floor" | "outbuilding"; key: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Parse floor plan files to extract names and outbuildings
  useEffect(() => {
    if (!floorPlanFiles) {
      setFloorNames({});
      setOutbuildings([]);
      return;
    }

    const names: Record<string, string> = {};
    const buildings: { key: string; name: string }[] = [];

    Object.entries(floorPlanFiles).forEach(([key, value]) => {
      if (key.startsWith("outbuilding_")) {
        const metadata = typeof value === "object" ? value : { name: key };
        buildings.push({
          key,
          name: metadata.name || key.replace("outbuilding_", "Outbuilding "),
        });
      } else if (!isNaN(parseInt(key))) {
        const metadata = typeof value === "object" ? value : {};
        if (metadata.name) {
          names[key] = metadata.name;
        }
      }
    });

    setFloorNames(names);
    setOutbuildings(buildings);
  }, [floorPlanFiles]);

  useEffect(() => {
    setFloors(currentFloors);
  }, [currentFloors]);

  const hasFloorPlan = (floorKey: string): boolean => {
    if (!floorPlanFiles) return false;
    const value = floorPlanFiles[floorKey];
    if (!value) return false;
    if (typeof value === "string") return !!value;
    return !!(value.image_path || value.drawing_data);
  };

  const getDropPointCount = async (floorNumber: number): Promise<number> => {
    const { count } = await supabase
      .from("drop_points")
      .select("*", { count: "exact", head: true })
      .eq("location_id", locationId)
      .eq("floor", floorNumber);
    return count || 0;
  };

  const updateLocationFloorData = async (
    newFloorCount: number,
    updatedFloorPlanFiles: FloorPlanFiles | null
  ) => {
    setSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        floors: newFloorCount,
        floor_plan_files: updatedFloorPlanFiles,
      };
      
      const { error } = await supabase
        .from("locations")
        .update(updateData)
        .eq("id", locationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Floor configuration updated",
      });

      onFloorsUpdated();
    } catch (error) {
      console.error("Error updating floors:", error);
      toast({
        title: "Error",
        description: "Failed to update floor configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddFloor = async () => {
    const newFloorCount = floors + 1;
    setFloors(newFloorCount);
    await updateLocationFloorData(newFloorCount, floorPlanFiles);
  };

  const handleRemoveFloor = async (floorNumber: number) => {
    // Check for drop points first
    const dpCount = await getDropPointCount(floorNumber);
    if (dpCount > 0) {
      toast({
        title: "Cannot Remove Floor",
        description: `Floor ${floorNumber} has ${dpCount} drop point(s). Remove them first.`,
        variant: "destructive",
      });
      setDeleteConfirm(null);
      return;
    }

    const newFloorCount = Math.max(1, floors - 1);
    
    // Remove floor plan file if exists
    const updatedFiles = { ...floorPlanFiles };
    delete updatedFiles[floorNumber.toString()];

    setFloors(newFloorCount);
    await updateLocationFloorData(newFloorCount, Object.keys(updatedFiles).length > 0 ? updatedFiles : null);
    setDeleteConfirm(null);
  };

  const handleRenameFloor = async (floorKey: string, newName: string) => {
    const updatedFiles: FloorPlanFiles = { ...floorPlanFiles };
    const currentValue = updatedFiles[floorKey];

    if (typeof currentValue === "object") {
      updatedFiles[floorKey] = { ...currentValue, name: newName };
    } else if (currentValue) {
      updatedFiles[floorKey] = { image_path: currentValue, name: newName };
    } else {
      updatedFiles[floorKey] = { name: newName };
    }

    setFloorNames((prev) => ({ ...prev, [floorKey]: newName }));
    await updateLocationFloorData(floors, updatedFiles);
    setEditingFloor(null);
  };

  const handleAddOutbuilding = async () => {
    if (!newOutbuildingName.trim()) return;

    const newKey = `outbuilding_${Date.now()}`;
    const updatedFiles: FloorPlanFiles = {
      ...floorPlanFiles,
      [newKey]: {
        name: newOutbuildingName.trim(),
        type: "outbuilding",
      },
    };

    setOutbuildings((prev) => [...prev, { key: newKey, name: newOutbuildingName.trim() }]);
    setNewOutbuildingName("");
    setShowAddOutbuilding(false);
    await updateLocationFloorData(floors, updatedFiles);
  };

  const handleRemoveOutbuilding = async (key: string) => {
    const updatedFiles = { ...floorPlanFiles };
    delete updatedFiles[key];

    setOutbuildings((prev) => prev.filter((ob) => ob.key !== key));
    await updateLocationFloorData(floors, Object.keys(updatedFiles).length > 0 ? updatedFiles : null);
    setDeleteConfirm(null);
  };

  const handleRenameOutbuilding = async (key: string, newName: string) => {
    const updatedFiles: FloorPlanFiles = { ...floorPlanFiles };
    const currentValue = updatedFiles[key];

    if (typeof currentValue === "object") {
      updatedFiles[key] = { ...currentValue, name: newName };
    } else {
      updatedFiles[key] = { name: newName, type: "outbuilding" };
    }

    setOutbuildings((prev) =>
      prev.map((ob) => (ob.key === key ? { ...ob, name: newName } : ob))
    );
    await updateLocationFloorData(floors, updatedFiles);
    setEditingFloor(null);
  };

  const startEditing = (key: string, currentName: string) => {
    setEditingFloor(key);
    setEditName(currentName);
  };

  const cancelEditing = () => {
    setEditingFloor(null);
    setEditName("");
  };

  const saveEditing = async () => {
    if (!editingFloor || !editName.trim()) return;

    if (editingFloor.startsWith("outbuilding_")) {
      await handleRenameOutbuilding(editingFloor, editName.trim());
    } else {
      await handleRenameFloor(editingFloor, editName.trim());
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Floor & Building Manager
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{locationName}</p>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 pr-4">
              {/* Regular Floors Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Floors
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddFloor}
                    disabled={saving}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Floor
                  </Button>
                </div>

                <div className="space-y-2">
                  {Array.from({ length: floors }, (_, i) => i + 1).map((floorNum) => {
                    const floorKey = floorNum.toString();
                    const displayName = floorNames[floorKey] || `Floor ${floorNum}`;
                    const hasPlan = hasFloorPlan(floorKey);

                    return (
                      <Card key={floorKey} className="border">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            {editingFloor === floorKey ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="h-8"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveEditing();
                                    if (e.key === "Escape") cancelEditing();
                                  }}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={saveEditing}
                                  disabled={saving}
                                >
                                  <Check className="h-4 w-4 text-success" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{displayName}</span>
                                  {hasPlan && (
                                    <Badge variant="secondary" className="text-xs">
                                      Has Plan
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => startEditing(floorKey, displayName)}
                                  >
                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                  {floors > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() =>
                                        setDeleteConfirm({ type: "floor", key: floorKey })
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* Outbuildings Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Outbuildings
                  </Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddOutbuilding(true)}
                    disabled={saving}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Outbuilding
                  </Button>
                </div>

                {showAddOutbuilding && (
                  <Card className="border border-primary/20">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Outbuilding name..."
                          value={newOutbuildingName}
                          onChange={(e) => setNewOutbuildingName(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddOutbuilding();
                            if (e.key === "Escape") {
                              setShowAddOutbuilding(false);
                              setNewOutbuildingName("");
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={handleAddOutbuilding}
                          disabled={saving || !newOutbuildingName.trim()}
                        >
                          <Check className="h-4 w-4 text-success" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setShowAddOutbuilding(false);
                            setNewOutbuildingName("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  {outbuildings.length === 0 && !showAddOutbuilding ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No outbuildings added
                    </p>
                  ) : (
                    outbuildings.map((ob) => {
                      const hasPlan = hasFloorPlan(ob.key);

                      return (
                        <Card key={ob.key} className="border">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              {editingFloor === ob.key ? (
                                <div className="flex items-center gap-2 flex-1">
                                  <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="h-8"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveEditing();
                                      if (e.key === "Escape") cancelEditing();
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={saveEditing}
                                    disabled={saving}
                                  >
                                    <Check className="h-4 w-4 text-success" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={cancelEditing}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{ob.name}</span>
                                    {hasPlan && (
                                      <Badge variant="secondary" className="text-xs">
                                        Has Plan
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => startEditing(ob.key, ob.name)}
                                    >
                                      <Pencil className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() =>
                                        setDeleteConfirm({ type: "outbuilding", key: ob.key })
                                      }
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteConfirm?.type === "floor" ? "Floor" : "Outbuilding"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === "floor"
                ? "This will remove the floor and its associated floor plan. Any drop points on this floor must be removed first."
                : "This will remove the outbuilding and its associated floor plan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm?.type === "floor") {
                  handleRemoveFloor(parseInt(deleteConfirm.key));
                } else if (deleteConfirm?.type === "outbuilding") {
                  handleRemoveOutbuilding(deleteConfirm.key);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
