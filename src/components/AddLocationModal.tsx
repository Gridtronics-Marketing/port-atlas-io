import { useState } from "react";
import { Upload, X, MapPin } from "lucide-react";
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

interface AddLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddLocationModal = ({ open, onOpenChange }: AddLocationModalProps) => {
  const [layoutFile, setLayoutFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    client: "",
    address: "",
    description: "",
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLayoutFile(file);
    }
  };

  const handleSubmit = () => {
    // Handle form submission
    console.log("Form data:", formData);
    console.log("Layout file:", layoutFile);
    onOpenChange(false);
  };

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
              <Label htmlFor="client">Client *</Label>
              <Select value={formData.client} onValueChange={(value) => setFormData({ ...formData, client: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent className="bg-popover border">
                  {mockClients.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter location description (optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Layout Upload */}
          <div className="space-y-2">
            <Label>Layout Map</Label>
            <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-primary/50 transition-colors">
              <CardContent className="p-6">
                {layoutFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Upload className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{layoutFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(layoutFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLayoutFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Upload Layout Map
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Drag and drop or click to select floor plan, blueprint, or layout diagram
                      </p>
                      <input
                        type="file"
                        accept="image/*,.pdf,.dwg"
                        onChange={handleFileChange}
                        className="hidden"
                        id="layout-upload"
                      />
                      <Label htmlFor="layout-upload">
                        <Button variant="outline" className="cursor-pointer" asChild>
                          <span>Choose File</span>
                        </Button>
                      </Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-gradient-primary hover:bg-primary-hover">
            Create Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};