import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Pencil, FileImage, Network } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CreateRiserDiagramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locationId: string;
  locationName: string;
  onRiserCreated?: () => void;
}

interface RiserFormData {
  name: string;
  description?: string;
}

export const CreateRiserDiagramModal = ({
  open,
  onOpenChange,
  locationId,
  locationName,
  onRiserCreated
}: CreateRiserDiagramModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<RiserFormData>();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image (PNG, JPEG) or PDF file.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (data: RiserFormData) => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = selectedFile.name.split('.').pop();
      const fileName = `riser_${data.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${timestamp}.${fileExtension}`;
      const filePath = `${locationId}/risers/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('floor-plans')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // TODO: Save riser diagram metadata to database
      // This would require creating a riser_diagrams table
      
      toast({
        title: "Riser Diagram Created",
        description: `Successfully uploaded "${data.name}".`,
      });

      handleClose();
      onRiserCreated?.();
    } catch (error) {
      console.error('Error uploading riser diagram:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload riser diagram. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrawNew = (data: RiserFormData) => {
    // Open FloorPlanEditor in riser mode
    const editorUrl = `/floor-plan-editor?mode=riser&location=${locationId}&name=${encodeURIComponent(data.name)}`;
    window.open(editorUrl, '_blank', 'width=1200,height=800');
    
    toast({
      title: "Opening Riser Editor",
      description: `Opening drawing canvas for "${data.name}".`,
    });

    handleClose();
  };

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Create New Riser Diagram - {locationName}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Design
            </TabsTrigger>
            <TabsTrigger value="draw" className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Draw New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Upload Existing Design
                </CardTitle>
                <CardDescription>
                  Upload an existing riser diagram image or PDF file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(handleUpload)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="upload-name">Diagram Name</Label>
                    <Input
                      id="upload-name"
                      {...register("name", { required: "Name is required" })}
                      placeholder="e.g., Main Building Riser"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="upload-description">Description (Optional)</Label>
                    <Textarea
                      id="upload-description"
                      {...register("description")}
                      placeholder="Describe this riser diagram..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file-upload">Select File</Label>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".png,.jpg,.jpeg,.pdf"
                      onChange={handleFileSelect}
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isUploading}>
                      {isUploading ? "Uploading..." : "Upload Diagram"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="draw" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Draw New Diagram
                </CardTitle>
                <CardDescription>
                  Create a new riser diagram using the built-in drawing tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(handleDrawNew)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="draw-name">Diagram Name</Label>
                    <Input
                      id="draw-name"
                      {...register("name", { required: "Name is required" })}
                      placeholder="e.g., East Wing Riser"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="draw-description">Description (Optional)</Label>
                    <Textarea
                      id="draw-description"
                      {...register("description")}
                      placeholder="Describe this riser diagram..."
                      rows={3}
                    />
                  </div>

                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Drawing Features</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Specialized telecom symbols (MDF, IDF, switches)</li>
                      <li>• Cable run drawing tools with industry colors</li>
                      <li>• Floor level markers and pathway indicators</li>
                      <li>• Equipment rack symbols and labeling</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleClose}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Open Drawing Canvas
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};