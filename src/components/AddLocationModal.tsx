import { useState, useEffect, useMemo } from "react";
import { Upload, X, MapPin, Plus, Minus, Building2, Users, Phone, FileText, FileImage } from "lucide-react";
import { InteractiveFloorPlan } from "@/components/InteractiveFloorPlan";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
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
import { ConfigurableSelect } from "@/components/ui/configurable-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useClients } from "@/hooks/useClients";
import { useLocations, type Location } from "@/hooks/useLocations";
import { useProjects } from "@/hooks/useProjects";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { convertPDFToImages, isPDFFile, isImageFile, type ConversionProgress } from "@/lib/pdf-converter";

interface AddLocationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location | null; // Optional location for editing
  preSelectedClientId?: string; // Optional client ID to filter projects
  preSelectedProjectId?: string; // Optional project ID to pre-select
}

export const AddLocationModal = ({ open, onOpenChange, location, preSelectedClientId, preSelectedProjectId }: AddLocationModalProps) => {
  const [layoutFiles, setLayoutFiles] = useState<{ [floorNumber: number]: File | null }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<{ [floorNumber: number]: ConversionProgress | null }>({});
  const [drawingMode, setDrawingMode] = useState<{ [floorNumber: number]: boolean }>({});
  const { clients } = useClients();
  const { projects } = useProjects();
  const { addLocation, updateLocation } = useLocations();
  const { toast } = useToast();
  const isEditing = !!location;
  
  const [formData, setFormData] = useState({
    name: "",
    address: "", // Full address for autocomplete
    street1: "",
    street2: "",
    city: "",
    state: "",
    zipCode: "",
    building_type: "",
    floors: 1,
    total_square_feet: "",
    access_instructions: "",
    contact_onsite: "",
    contact_phone: "",
    project_id: "",
    status: "Active" as "Active" | "In Progress" | "Completed" | "On Hold",
  });

  const [coordinates, setCoordinates] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
  });

  // Filter projects by client if preSelectedClientId is provided
  const filteredProjects = useMemo(() => 
    preSelectedClientId 
      ? projects.filter(project => project.client_id === preSelectedClientId)
      : projects,
    [preSelectedClientId, projects]
  );

  // Effect to populate form when editing or when modal opens with pre-selected values
  useEffect(() => {
    if (location && open) {
      // Parse existing address into separate fields
      const addressParts = (location.address || "").split(", ");
      setFormData({
        name: location.name || "",
        address: location.address || "",
        street1: addressParts[0] || "",
        street2: addressParts[1] || "",
        city: addressParts[2] || "",
        state: addressParts[3] || "",
        zipCode: addressParts[4] || "",
        building_type: location.building_type || "",
        floors: location.floors || 1,
        total_square_feet: location.total_square_feet?.toString() || "",
        access_instructions: location.access_instructions || "",
        contact_onsite: location.contact_onsite || "",
        contact_phone: location.contact_phone || "",
        project_id: location.project_id || "",
        status: location.status as any || "Active",
      });
    } else if (!location && open) {
      resetForm();
      
      // Auto-select project if pre-selected or if only one project available for client
      if (preSelectedProjectId) {
        console.log('✅ Pre-selecting project:', preSelectedProjectId);
        setFormData(prev => ({ ...prev, project_id: preSelectedProjectId }));
      } else if (preSelectedClientId && filteredProjects.length === 1) {
        console.log('✅ Auto-selecting single project for client:', filteredProjects[0].name);
        setFormData(prev => ({ ...prev, project_id: filteredProjects[0].id }));
       } else if (preSelectedClientId && filteredProjects.length === 0) {
         console.warn('⚠️ No projects found for client:', preSelectedClientId);
         // Don't show error - locations can be created without projects
       } else if (preSelectedClientId && filteredProjects.length > 1) {
        console.log('ℹ️ Multiple projects available for client, user needs to select one');
      }
    }
  }, [location, open, preSelectedProjectId, preSelectedClientId, filteredProjects, toast]);

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      zipCode: "",
      building_type: "",
      floors: 1,
      total_square_feet: "",
      access_instructions: "",
      contact_onsite: "",
      contact_phone: "",
      project_id: "",
      status: "Active",
    });
    setCoordinates({
      latitude: null,
      longitude: null,
    });
    setLayoutFiles({});
    setConversionProgress({});
  };

  const handleFileChange = async (floorNumber: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!isPDFFile(file) && !isImageFile(file)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload PDF or image files only (PDF, PNG, JPG, WEBP).",
        variant: "destructive",
      });
      return;
    }

    // If it's an image, use it directly
    if (isImageFile(file)) {
      setLayoutFiles(prev => ({
        ...prev,
        [floorNumber]: file
      }));
      return;
    }

    // If it's a PDF, convert it to images
    if (isPDFFile(file)) {
      try {
        setConversionProgress(prev => ({
          ...prev,
          [floorNumber]: { currentPage: 0, totalPages: 0, progress: 0 }
        }));

        const convertedPages = await convertPDFToImages(file, (progress) => {
          setConversionProgress(prev => ({
            ...prev,
            [floorNumber]: progress
          }));
        });

        // For single page PDFs, use the first page directly
        // For multi-page PDFs, create a combined file or use first page (for now)
        if (convertedPages.length > 0) {
          const firstPage = convertedPages[0];
          const imageFile = new File([firstPage.blob], `floor_${floorNumber}.png`, {
            type: 'image/png'
          });
          
          setLayoutFiles(prev => ({
            ...prev,
            [floorNumber]: imageFile
          }));

          toast({
            title: "PDF Converted",
            description: `Successfully converted PDF to image (${convertedPages.length} page${convertedPages.length > 1 ? 's' : ''} processed).`,
          });
        }

      } catch (error) {
        console.error('PDF conversion error:', error);
        
        // Clear conversion progress for this floor
        setConversionProgress(prev => {
          const newState = { ...prev };
          delete newState[floorNumber];
          return newState;
        });

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        
        toast({
          title: "Conversion Failed",
          description: `Failed to convert PDF: ${errorMessage}. Please try with a smaller PDF or use an image file (JPG, PNG).`,
          variant: "destructive",
        });
      } finally {
        setConversionProgress(prev => ({
          ...prev,
          [floorNumber]: null
        }));
      }
    }
  };

  const removeFile = (floorNumber: number) => {
    setLayoutFiles(prev => {
      const updated = { ...prev };
      delete updated[floorNumber];
      return updated;
    });
    setConversionProgress(prev => {
      const updated = { ...prev };
      delete updated[floorNumber];
      return updated;
    });
  };

  const handleSubmit = async () => {
    // Check required fields (project is now optional)
    const requiredFieldsError = !formData.name.trim() || !formData.street1.trim() || !formData.city.trim() || !formData.state.trim();
    
    if (requiredFieldsError) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Street Address, City, and State)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Combine address fields
      const addressParts = [
        formData.street1.trim(),
        formData.street2.trim(),
        formData.city.trim(),
        formData.state.trim(),
        formData.zipCode.trim()
      ].filter(part => part); // Remove empty parts
      
      const locationData = {
        name: formData.name.trim(),
        address: addressParts.join(", "),
        building_type: formData.building_type.trim() || null,
        floors: formData.floors,
        total_square_feet: formData.total_square_feet ? parseInt(formData.total_square_feet) : null,
        access_instructions: formData.access_instructions.trim() || null,
        contact_onsite: formData.contact_onsite.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        project_id: formData.project_id || null,
        status: formData.status,
        completion_percentage: 0,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        floor_plan_files: {},
      };

      // Create or update the location
      const resultLocation = isEditing 
        ? await updateLocation(location!.id, locationData)
        : await addLocation(locationData);
      
      // Upload floor plan files to storage if any were selected
      const uploadedFiles: { [key: number]: string } = {};
      const uploadPromises = Object.entries(layoutFiles).map(async ([floorStr, file]) => {
        if (file) {
          const floorNumber = parseInt(floorStr);
          const fileExt = file.name.split('.').pop();
          const fileName = `${resultLocation.id}/floor_${floorNumber}.${fileExt}`;
          
          const { data, error } = await supabase.storage
            .from('floor-plans')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: true
            });

          if (error) {
            console.error(`Error uploading floor ${floorNumber} plan:`, error);
            throw error;
          }

          uploadedFiles[floorNumber] = fileName;
        }
      });

      await Promise.all(uploadPromises);

      // Update location with floor plan file paths
      if (Object.keys(uploadedFiles).length > 0) {
        console.log('Updating location with floor plan files:', {
          locationId: resultLocation.id,
          uploadedFiles
        });
        
        const { data: updateData, error: updateError } = await supabase
          .from('locations')
          .update({ floor_plan_files: uploadedFiles })
          .eq('id', resultLocation.id)
          .select();

        if (updateError) {
          console.error('Database update error:', updateError);
          toast({
            title: "Database Update Failed",
            description: `Failed to link floor plans to location: ${updateError.message}`,
            variant: "destructive",
          });
          throw updateError;
        } else {
          console.log('Database updated successfully:', updateData);
          toast({
            title: "Floor Plans Uploaded",
            description: `${Object.keys(uploadedFiles).length} floor plan${Object.keys(uploadedFiles).length > 1 ? 's' : ''} uploaded and linked successfully.`,
          });
        }
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating location:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload floor plans. Please try again.",
        variant: "destructive",
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col bg-card border overflow-hidden">
        <DialogHeader className="flex-shrink-0 px-6 pt-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="h-6 w-6 text-primary" />
            {isEditing ? 'Edit Location' : 'Add New Location'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing 
                 ? 'Update location details and manage floor plans for your jobsite.'
                 : preSelectedClientId
                   ? filteredProjects.length === 0
                     ? 'No projects found for this client. You can still create a standalone location.'
                     : filteredProjects.length === 1
                       ? `Adding location to project: ${filteredProjects[0].name}`
                       : `Select from ${filteredProjects.length} available projects or create a standalone location.`
                   : 'Create a new jobsite location and optionally assign to a project. Upload floor plans for comprehensive drop point management.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="space-y-6 py-4">
            {/* Basic Information Section */}
            <Card className="shadow-soft border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Location Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter location name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="building_type" className="text-sm font-medium">Building Type</Label>
                    <Input
                      id="building_type"
                      placeholder="Office, Warehouse, Retail, etc."
                      value={formData.building_type}
                      onChange={(e) => setFormData({ ...formData, building_type: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <AddressAutocomplete
                    label="Location Address"
                    value={formData.address}
                    onChange={(address) => setFormData({ ...formData, address })}
                    onAddressSelect={(components) => {
                      setFormData({
                        ...formData,
                        address: components.fullAddress,
                        street1: components.street,
                        city: components.city,
                        state: components.state,
                        zipCode: components.zip,
                      });
                      setCoordinates({
                        latitude: components.latitude,
                        longitude: components.longitude,
                      });
                    }}
                    placeholder="Start typing an address..."
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">City *</Label>
                      <Input
                        id="city"
                        placeholder="City"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium">State *</Label>
                      <Input
                        id="state"
                        placeholder="State"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="h-10"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zipCode" className="text-sm font-medium">Zip Code</Label>
                      <Input
                        id="zipCode"
                        placeholder="12345"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        className="h-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="floors" className="text-sm font-medium">Number of Floors *</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => adjustFloors(false)}
                        disabled={formData.floors <= 1}
                        className="h-10 w-10 p-0"
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
                        className="text-center h-10 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => adjustFloors(true)}
                        className="h-10 w-10 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="total_square_feet" className="text-sm font-medium">Total Square Feet</Label>
                    <Input
                      id="total_square_feet"
                      type="number"
                      placeholder="Enter total sq ft"
                      value={formData.total_square_feet}
                      onChange={(e) => setFormData({ ...formData, total_square_feet: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <Label htmlFor="project_id" className="text-sm font-medium">
                     Project Assignment (Optional)
                   </Label>
                   <Select value={formData.project_id || "none"} onValueChange={(value) => setFormData({ ...formData, project_id: value === "none" ? "" : value })}>
                     <SelectTrigger className="h-10 bg-background">
                       <SelectValue placeholder="Select project (optional)" />
                     </SelectTrigger>
                     <SelectContent className="bg-popover border z-50">
                       <SelectItem value="none">No Project (Standalone Location)</SelectItem>
                       {filteredProjects.map((project) => (
                         <SelectItem key={project.id} value={project.id}>
                           {project.name}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">Location Status</Label>
                  <ConfigurableSelect
                    category="location_statuses"
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    placeholder="Select status"
                    className="h-10 bg-background"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information Section */}
            <Card className="shadow-soft border-border">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_onsite" className="text-sm font-medium">On-site Contact</Label>
                    <Input
                      id="contact_onsite"
                      placeholder="Contact person name"
                      value={formData.contact_onsite}
                      onChange={(e) => setFormData({ ...formData, contact_onsite: e.target.value })}
                      className="h-10"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone" className="text-sm font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Contact Phone
                    </Label>
                    <Input
                      id="contact_phone"
                      placeholder="Phone number"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="access_instructions" className="text-sm font-medium flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Access Instructions
                  </Label>
                  <Textarea
                    id="access_instructions"
                    placeholder="Special access instructions, key codes, contact procedures, etc."
                    value={formData.access_instructions}
                    onChange={(e) => setFormData({ ...formData, access_instructions: e.target.value })}
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Floor Plans Section */}
            {formData.floors > 0 && (
              <Card className="shadow-soft border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                      Floor Plans
                    </CardTitle>
                    {formData.floors > 1 && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                        {formData.floors} Floor{formData.floors > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Upload floor plans, blueprints, or layout diagrams for each floor
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {floorNumbers.map((floorNumber, index) => {
                      const file = layoutFiles[floorNumber];
                      return (
                        <div key={floorNumber}>
                          {index > 0 && <Separator className="my-4" />}
                          <Card className="border-dashed border-2 border-muted-foreground/25 hover:border-primary/40 transition-colors duration-200">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                  <Label className="text-sm font-medium text-foreground">
                                    {formData.floors === 1 ? 'Floor Plan' : `Floor ${floorNumber}`}
                                  </Label>
                                  {formData.floors > 1 && (
                                    <Badge variant="outline" className="text-xs">
                                      Level {floorNumber}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                               {file ? (
                                 <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                   <div className="flex items-center gap-3">
                                     <div className="p-3 bg-primary/10 rounded-lg">
                                       {isPDFFile(file) ? (
                                         <FileImage className="h-5 w-5 text-primary" />
                                       ) : (
                                         <Upload className="h-5 w-5 text-primary" />
                                       )}
                                     </div>
                                     <div>
                                       <p className="font-medium text-foreground">{file.name}</p>
                                       <p className="text-sm text-muted-foreground">
                                         {(file.size / 1024 / 1024).toFixed(2)} MB • {isPDFFile(file) ? 'Converted to PNG' : 'Ready for upload'}
                                       </p>
                                     </div>
                                   </div>
                                   <Button
                                     variant="ghost"
                                     size="sm"
                                     onClick={() => removeFile(floorNumber)}
                                     className="text-muted-foreground hover:text-destructive"
                                   >
                                     <X className="h-4 w-4" />
                                   </Button>
                                 </div>
                               ) : conversionProgress[floorNumber] ? (
                                 <div className="p-4 bg-muted/50 rounded-lg">
                                   <div className="flex items-center gap-3 mb-3">
                                     <div className="p-3 bg-primary/10 rounded-lg">
                                       <FileImage className="h-5 w-5 text-primary animate-pulse" />
                                     </div>
                                     <div>
                                       <p className="font-medium text-foreground">Converting PDF...</p>
                                       <p className="text-sm text-muted-foreground">
                                         Page {conversionProgress[floorNumber]!.currentPage} of {conversionProgress[floorNumber]!.totalPages}
                                       </p>
                                     </div>
                                   </div>
                                   <div className="w-full bg-muted rounded-full h-2">
                                     <div 
                                       className="bg-primary h-2 rounded-full transition-all duration-300"
                                       style={{ width: `${conversionProgress[floorNumber]!.progress}%` }}
                                     />
                                   </div>
                                 </div>
                              ) : (
                                 <div className="text-center py-8">
                                   <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                                     <Upload className="h-6 w-6 text-muted-foreground" />
                                   </div>
                                   <div className="space-y-2">
                                     <p className="text-sm font-medium text-foreground">
                                       Upload {formData.floors === 1 ? 'Floor Plan' : `Floor ${floorNumber} Plan`}
                                     </p>
                                       <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                         Drop files here or click to browse. Supports images (JPG, PNG, WEBP) and PDFs (converted to images)
                                       </p>
                                     <div className="flex items-center gap-3 justify-center mt-4">
                                       <input
                                         type="file"
                                         accept="image/*,.pdf"
                                         onChange={(e) => handleFileChange(floorNumber, e)}
                                         className="hidden"
                                         id={`layout-upload-${floorNumber}`}
                                       />
                                       <Label htmlFor={`layout-upload-${floorNumber}`} className="cursor-pointer">
                                         <Button variant="outline" size="sm" asChild>
                                           <span className="bg-background hover:bg-muted">
                                             <Upload className="h-4 w-4 mr-2" />
                                             Choose File
                                           </span>
                                         </Button>
                                       </Label>
                                       
                                       <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                         <div className="h-px bg-border flex-1"></div>
                                         <span>or</span>
                                         <div className="h-px bg-border flex-1"></div>
                                       </div>
                                       
                                         <Button 
                                           variant="outline" 
                                           size="sm"
                                           onClick={() => setDrawingMode(prev => ({ ...prev, [floorNumber]: !prev[floorNumber] }))}
                                           className="bg-background hover:bg-muted"
                                         >
                                           <FileImage className="h-4 w-4 mr-2" />
                                           {drawingMode[floorNumber] ? 'Exit Draw Mode' : 'Draw Map'}
                                         </Button>
                                     </div>
                                   </div>
                                  </div>
                               )}
                               
                                 {drawingMode[floorNumber] && (
                                  <div className="mt-4 border-t pt-4">
                                    <div className="min-h-[500px] border rounded-lg overflow-hidden bg-background">
                                       <InteractiveFloorPlan
                                         locationId={location?.id || 'temp-location-id'}
                                         floorNumber={floorNumber}
                                         className="w-full h-full"
                                       />
                                    </div>
                                    <div className="flex justify-end mt-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setDrawingMode(prev => ({ ...prev, [floorNumber]: false }))}
                                      >
                                        Done Drawing
                                      </Button>
                                    </div>
                                  </div>
                                )}
                             </CardContent>
                           </Card>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Separator className="flex-shrink-0" />
        
        <DialogFooter className="flex-shrink-0 p-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-w-[100px]">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-gradient-primary hover:bg-primary-hover min-w-[140px]"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isEditing ? "Updating..." : "Creating...") 
              : (isEditing ? "Update Location" : "Create Location")
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};