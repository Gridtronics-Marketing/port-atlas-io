import { useState, useEffect, useMemo } from "react";
import { Upload, X, MapPin, Plus, Minus, Building2, Users, Phone, FileText, FileImage, Paintbrush, Search, UserPlus } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  const [selectedClientId, setSelectedClientId] = useState<string | null>(preSelectedClientId || null);
  const [showClientCreationForm, setShowClientCreationForm] = useState(false);
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const [sameAsPhysical, setSameAsPhysical] = useState(false);
  const { clients, addClient } = useClients();
  const { projects } = useProjects();
  const { addLocation, updateLocation } = useLocations();
  const { toast } = useToast();
  const isEditing = !!location;
  
  const [clientFormData, setClientFormData] = useState<{
    name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    address: string;
    billing_address: string;
    status: "Active" | "Inactive" | "Pending";
  }>({
    name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    address: "",
    billing_address: "",
    status: "Active"
  });
  
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

  // Filter projects by selected client
  const filteredProjects = useMemo(() => 
    selectedClientId 
      ? projects.filter(project => project.client_id === selectedClientId)
      : projects,
    [selectedClientId, projects]
  );
  
  // Get selected client details
  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId),
    [clients, selectedClientId]
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
      
      // Set selected client based on location's project
      if (location.project_id) {
        const project = projects.find(p => p.id === location.project_id);
        if (project) {
          setSelectedClientId(project.client_id);
        }
      }
    } else if (!location && open) {
      resetForm();
      setSelectedClientId(preSelectedClientId || null);
      setShowClientCreationForm(false);
      
      // Auto-select project if pre-selected or if only one project available for client
      if (preSelectedProjectId) {
        setFormData(prev => ({ ...prev, project_id: preSelectedProjectId }));
      } else if (selectedClientId && filteredProjects.length === 1) {
        setFormData(prev => ({ ...prev, project_id: filteredProjects[0].id }));
      }
    }
  }, [location, open, preSelectedProjectId, preSelectedClientId, filteredProjects, selectedClientId, projects]);

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
    setSelectedClientId(null);
    setShowClientCreationForm(false);
    setClientFormData({
      name: "",
      contact_name: "",
      contact_email: "",
      contact_phone: "",
      address: "",
      billing_address: "",
      status: "Active"
    });
  };
  
  const handleCreateClient = async () => {
    if (!clientFormData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Client name is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const newClient = await addClient(clientFormData);
      setSelectedClientId(newClient.id);
      setShowClientCreationForm(false);
      setClientFormData({
        name: "",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        address: "",
        billing_address: "",
        status: "Active"
      });
      toast({
        title: "Success",
        description: "Client created successfully",
      });
    } catch (error) {
      console.error('Error creating client:', error);
    }
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
    // Validate required fields
    const requiredFieldsError = !formData.name.trim() || !formData.street1.trim() || !formData.city.trim() || !formData.state.trim();
    
    if (requiredFieldsError) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Name, Street Address, City, and State)",
        variant: "destructive",
      });
      return;
    }

    // For new locations, require client selection (either existing or newly created)
    if (!isEditing && !selectedClientId && !showClientCreationForm) {
      toast({
        title: "Client Required",
        description: "Please select a client or create a new one to continue.",
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
            {/* Client Selection Section */}
            {!isEditing && (
              <Card className="shadow-soft border-border">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Client Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!showClientCreationForm ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Select Client *</Label>
                        <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={clientSearchOpen}
                              className="w-full justify-between h-10"
                            >
                              {selectedClient ? selectedClient.name : "Search for a client..."}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search clients..." />
                              <CommandList>
                                <CommandEmpty>
                                  <div className="py-6 text-center text-sm">
                                    <p className="text-muted-foreground mb-2">No client found.</p>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setShowClientCreationForm(true);
                                        setClientSearchOpen(false);
                                      }}
                                      className="bg-gradient-primary"
                                    >
                                      <UserPlus className="mr-2 h-4 w-4" />
                                      Create New Client
                                    </Button>
                                  </div>
                                </CommandEmpty>
                                <CommandGroup>
                                  {clients.map((client) => (
                                    <CommandItem
                                      key={client.id}
                                      value={client.name}
                                      onSelect={() => {
                                        setSelectedClientId(client.id);
                                        setClientSearchOpen(false);
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium">{client.name}</span>
                                        {client.contact_name && (
                                          <span className="text-xs text-muted-foreground">
                                            {client.contact_name}
                                          </span>
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Separator className="flex-1" />
                        <span className="text-xs text-muted-foreground">OR</span>
                        <Separator className="flex-1" />
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowClientCreationForm(true)}
                        className="w-full"
                      >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create New Client
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold">New Client Information</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowClientCreationForm(false)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="client_name">Client Name *</Label>
                            <Input
                              id="client_name"
                              value={clientFormData.name}
                              onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                              placeholder="Enter client name"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="client_status">Status</Label>
                            <ConfigurableSelect
                              category="client_statuses"
                              value={clientFormData.status}
                              onValueChange={(value) => setClientFormData({ ...clientFormData, status: value as "Active" | "Inactive" | "Pending" })}
                              placeholder="Select status"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="client_contact_name">Contact Name</Label>
                            <Input
                              id="client_contact_name"
                              value={clientFormData.contact_name}
                              onChange={(e) => setClientFormData({ ...clientFormData, contact_name: e.target.value })}
                              placeholder="Primary contact"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="client_contact_email">Contact Email</Label>
                            <Input
                              id="client_contact_email"
                              type="email"
                              value={clientFormData.contact_email}
                              onChange={(e) => setClientFormData({ ...clientFormData, contact_email: e.target.value })}
                              placeholder="contact@company.com"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="client_contact_phone">Contact Phone</Label>
                          <Input
                            id="client_contact_phone"
                            value={clientFormData.contact_phone}
                            onChange={(e) => setClientFormData({ ...clientFormData, contact_phone: e.target.value })}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <AddressAutocomplete
                            label="Physical Address"
                            value={clientFormData.address}
                            onChange={(address) => {
                              setClientFormData({ ...clientFormData, address });
                              if (sameAsPhysical) {
                                setClientFormData(prev => ({ ...prev, billing_address: address }));
                              }
                            }}
                            placeholder="Start typing an address..."
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="same-address"
                            checked={sameAsPhysical}
                            onCheckedChange={(checked) => {
                              setSameAsPhysical(checked as boolean);
                              if (checked) {
                                setClientFormData(prev => ({ ...prev, billing_address: prev.address }));
                              }
                            }}
                          />
                          <Label htmlFor="same-address" className="text-sm font-normal cursor-pointer">
                            Billing address same as physical address
                          </Label>
                        </div>
                        
                        {!sameAsPhysical && (
                          <div className="space-y-2">
                            <AddressAutocomplete
                              label="Billing Address"
                              value={clientFormData.billing_address}
                              onChange={(address) => setClientFormData({ ...clientFormData, billing_address: address })}
                              placeholder="Start typing an address..."
                            />
                          </div>
                        )}
                        
                        <Button
                          type="button"
                          onClick={handleCreateClient}
                          className="w-full bg-gradient-primary"
                        >
                          <UserPlus className="mr-2 h-4 w-4" />
                          Create Client & Continue
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

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
                                      <div className="flex items-center justify-between py-2 px-3 bg-primary/10 rounded-md border border-primary/20 mb-3">
                                        <span className="text-sm font-medium">
                                          {location?.id ? "Editing floor plan" : "Drawing mode active - Your work is auto-saved"}
                                        </span>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setDrawingMode(prev => ({ ...prev, [floorNumber]: false }))}
                                        >
                                          Exit Drawing
                                        </Button>
                                      </div>
                                      <div className="min-h-[500px] border-2 border-primary/20 rounded-lg overflow-hidden bg-background shadow-lg">
                                        <InteractiveFloorPlan
                                          locationId={location?.id || ""}
                                          floorNumber={floorNumber}
                                          fileUrl={file ? URL.createObjectURL(file) : undefined}
                                          className="w-full h-full"
                                        />
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