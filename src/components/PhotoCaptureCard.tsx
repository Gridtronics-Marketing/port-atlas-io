import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Camera, Image, FileImage, AlertCircle } from 'lucide-react';
import { usePhotoCapture, CapturedPhoto } from '@/hooks/usePhotoCapture';

interface PhotoCaptureCardProps {
  employeeId?: string;
  projectId?: string;
  locationId?: string;
  workOrderId?: string;
  onPhotoCapture?: (photo: CapturedPhoto) => void;
}

const photoCategories = [
  { value: 'progress', label: 'Progress Photo' },
  { value: 'before', label: 'Before Work' },
  { value: 'after', label: 'After Work' },
  { value: 'issue', label: 'Issue/Problem' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'safety', label: 'Safety' },
  { value: 'documentation', label: 'Documentation' },
];

export function PhotoCaptureCard({ 
  employeeId, 
  projectId, 
  locationId, 
  workOrderId,
  onPhotoCapture 
}: PhotoCaptureCardProps) {
  const { loading, capturePhoto, selectFromGallery } = usePhotoCapture();
  
  const [category, setCategory] = useState('progress');
  const [description, setDescription] = useState('');
  const [lastPhoto, setLastPhoto] = useState<CapturedPhoto | null>(null);

  const handleCapture = async () => {
    if (!employeeId) return;

    const photo = await capturePhoto(
      category,
      description,
      projectId,
      locationId,
      workOrderId,
      employeeId
    );

    if (photo) {
      setLastPhoto(photo);
      setDescription('');
      onPhotoCapture?.(photo);
    }
  };

  const handleGallerySelect = async () => {
    if (!employeeId) return;

    const photo = await selectFromGallery(
      category,
      description,
      projectId,
      locationId,
      workOrderId,
      employeeId
    );

    if (photo) {
      setLastPhoto(photo);
      setDescription('');
      onPhotoCapture?.(photo);
    }
  };

  if (!employeeId) {
    return (
      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            Employee ID required for photo capture
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          Photo Documentation
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {lastPhoto && (
          <div className="border rounded-lg p-3 bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <FileImage className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Last photo captured
              </span>
            </div>
            <div className="text-xs text-green-600">
              {lastPhoto.category} - {lastPhoto.filename}
            </div>
            {lastPhoto.description && (
              <div className="text-xs text-green-600 mt-1">
                {lastPhoto.description}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label>Photo Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {photoCategories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this photo shows..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button 
            onClick={handleCapture} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          
          <Button 
            onClick={handleGallerySelect} 
            disabled={loading}
            variant="outline"
          >
            <Image className="h-4 w-4 mr-2" />
            From Gallery
          </Button>
        </div>

        {(projectId || locationId || workOrderId) && (
          <div className="text-xs text-muted-foreground">
            <div className="flex flex-wrap gap-1">
              <span>Linked to:</span>
              {projectId && <Badge variant="secondary" className="text-xs">Project</Badge>}
              {locationId && <Badge variant="secondary" className="text-xs">Location</Badge>}
              {workOrderId && <Badge variant="secondary" className="text-xs">Work Order</Badge>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}