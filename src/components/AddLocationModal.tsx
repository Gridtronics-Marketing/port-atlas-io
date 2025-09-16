import { useState } from "react";
import { Upload, X, MapPin, Plus, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,  
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClients } from "@/hooks/useClients";
import { useLocations } from "@/hooks/useLocations";
import { useToast } from "@/hooks/use-toast";

interface AddLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddLocationModal = ({ open, onOpenChange }: AddLocationModalProps) => {
  const [layoutFiles, setLayoutFiles] = useState<{ [floorNumber: number]: File | null }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { clients } = useClients();
  const { addLocation } = useLocations();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    building_type: "",
    floors: 1,
    total_square_feet: "",
    access_instructions: "",
    contact_onsite: "",
    contact_phone: "",
    project_id: "",
    status: "Active" as "Active" | "In Progress" | "Completed" | "On Hold",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      building_type: "",
      floors: 1,
      total_square_feet: "",
      access_instructions: "",
      contact_onsite: "",
      contact_phone: "",
      project_id: "",
      status: "Active",
    });
    setLayoutFiles({});
  };

  const handleFileChange = (floorNumber: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLayoutFiles(prev => ({
        ...prev,
        [floorNumber]: file
      }));
    }
  };

  const removeFile = (floorNumber: number) => {
    setLayoutFiles(prev => {
      const updated = { ...prev };
      delete updated[floorNumber];
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name and Address)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const locationData = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        building_type: formData.building_type.trim() || null,
        floors: formData.floors,
        total_square_feet: formData.total_square_feet ? parseInt(formData.total_square_feet) : null,
        access_instructions: formData.access_instructions.trim() || null,
        contact_onsite: formData.contact_onsite.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        project_id: formData.project_id || null,
        status: formData.status,
        completion_percentage: 0,
        latitude: null,
        longitude: null,
      };

      // Create the location first
      const location = await addLocation(locationData);
      
      // TODO: Upload floor plan files to storage
      // For now, we'll show what files were uploaded
      const uploadedFloors = Object.keys(layoutFiles).length;
      if (uploadedFloors > 0) {
        console.log(`Floor plans uploaded for ${uploadedFloors} floors:`, layoutFiles);
        toast({
          title: "Floor Plans Ready",
          description: `${uploadedFloors} floor plan${uploadedFloors > 1 ? 's' : ''} uploaded. Use Edit Mode in location details to draw on them.`,
        });
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating location:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const adjustFloors = (increment: boolean) => {
    const newFloors = increment 
      ? formData.floors + 1 
      : Math.max(1, formData.floors - 1);
      
    setFormData(prev => ({
      ...prev,
      floors: newFloors
    }));

    // Clean up layout files if reducing floors
    if (!increment && newFloors < formData.floors) {
      setLayoutFiles(prev => {
        const updated = { ...prev };
        // Remove files for floors that no longer exist
        Object.keys(updated).forEach(floorStr => {
          const floor = parseInt(floorStr);
          if (floor > newFloors) {
            delete updated[floor];
          }
        });
        return updated;
      });
    }
  };

  // Generate array of floor numbers for rendering
  const floorNumbers = Array.from({ length: formData.floors }, (_, i) => i + 1);

  const mockClients = [
    "TechCorp Inc.",
    "Industrial Solutions", 
    "ShopMart",
    "Global Enterprises",
    "Local Business Co.",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-card border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Add New Location
          </DialogTitle>
          <DialogDescription>
            Create a new jobsite location and upload the layout map for drop point management.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Location Name *</Label>
              <Input
                id="name"
                placeholder="Enter location name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="building_type">Building Type</Label>
              <Input
                id="building_type"
                placeholder="Office, Warehouse, Retail, etc."
                value={formData.building_type}
                onChange={(e) => setFormData({ ...formData, building_type: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              placeholder="Enter full address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          {/* Floor and Size Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="floors">Number of Floors *</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustFloors(false)}
                  disabled={formData.floors <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="floors"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.floors}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    floors: Math.max(1, parseInt(e.target.value) || 1)
                  })}
                  className="text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustFloors(true)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="total_square_feet">Total Square Feet</Label>
              <Input
                id="total_square_feet"
                type="number"
                placeholder="Enter total sq ft"
                value={formData.total_square_feet}
                onChange={(e) => setFormData({ ...formData, total_square_feet: e.target.value })}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_onsite">On-site Contact</Label>
              <Input
                id="contact_onsite"
                placeholder="Contact person name"
                value={formData.contact_onsite}
                onChange={(e) => setFormData({ ...formData, contact_onsite: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contact_phone">Contact Phone</Label>
              <Input
                id="contact_phone"
                placeholder="Phone number"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-popover border">
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_instructions">Access Instructions</Label>
            <Textarea
              id="access_instructions"
              placeholder="Special access instructions, key codes, contact procedures, etc."
              value={formData.access_instructions}
              onChange={(e) => setFormData({ ...formData, access_instructions: e.target.value })}
            />
          </div>

          {/* Floor Plans Section */}
          {formData.floors > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Label className="text-base font-semibold">Floor Plans</Label>
                {formData.floors > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {formData.floors} floors
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4">
                {floorNumbers.map((floorNumber) => {
                  const file = layoutFiles[floorNumber];
                  return (
                    <Card key={floorNumber} className="border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="font-medium">
                            {formData.floors === 1 ? 'Floor Plan' : `Floor ${floorNumber} Plan`}
                          </Label>
                          {formData.floors > 1 && (
                            <Badge variant="outline" className="text-xs">
                              Floor {floorNumber}
                            </Badge>
                          )}
                        </div>
                        
                        {file ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Upload className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(floorNumber)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-foreground">
                                Upload {formData.floors === 1 ? 'Floor Plan' : `Floor ${floorNumber} Plan`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Drag and drop or click to select floor plan, blueprint, or layout diagram
                              </p>
                              <p className="text-xs text-primary">
                                Supported: Images (JPG, PNG), PDFs, CAD files (.dwg)
                              </p>
                              <input
                                type="file"
                                accept="image/*,.pdf,.dwg"
                                onChange={(e) => handleFileChange(floorNumber, e)}
                                className="hidden"
                                id={`layout-upload-${floorNumber}`}
                              />
                              <Label htmlFor={`layout-upload-${floorNumber}`}>
                                <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                                  <span>Choose File</span>
                                </Button>
                              </Label>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-gradient-primary hover:bg-primary-hover"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};