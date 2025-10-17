import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Camera, AlertTriangle, Maximize2, Upload } from 'lucide-react';
import { SafetyChecklist, useSafetyChecklists } from '@/hooks/useSafetyChecklists';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';

interface SafetyChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklist: SafetyChecklist;
  employeeId?: string;
  projectId?: string;
  locationId?: string;
  workOrderId?: string;
}

export function SafetyChecklistModal({ 
  open, 
  onOpenChange, 
  checklist, 
  employeeId,
  projectId,
  locationId,
  workOrderId 
}: SafetyChecklistModalProps) {
  const { submitChecklist } = useSafetyChecklists();
  const { capturePhoto, selectFromGallery, loading: photoLoading } = usePhotoCapture();
  
  const [responses, setResponses] = useState<Record<string, {
    checked: boolean;
    notes?: string;
    photo_url?: string;
    photo_type?: 'standard' | 'panoramic';
  }>>({});
  const [loading, setLoading] = useState(false);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        checked,
      },
    }));
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setResponses(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes,
      },
    }));
  };

  const handlePhotoCapture = async (itemId: string, isPanoramic: boolean = false) => {
    if (!employeeId) return;
    
    const photo = await capturePhoto(
      `${checklist.name} - ${checklist.items.find(i => i.id === itemId)?.title}`,
      'safety-checklist',
      projectId,
      locationId,
      workOrderId,
      employeeId,
      false,
      isPanoramic
    );

    if (photo) {
      setResponses(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          photo_url: photo.url,
          photo_type: isPanoramic ? 'panoramic' : 'standard',
        },
      }));
    }
  };

  const handleGallerySelect = async (itemId: string, isPanoramic: boolean = false) => {
    if (!employeeId) return;
    
    const photo = await selectFromGallery(
      `${checklist.name} - ${checklist.items.find(i => i.id === itemId)?.title}`,
      'safety-checklist',
      projectId,
      locationId,
      workOrderId,
      employeeId,
      false,
      isPanoramic
    );

    if (photo) {
      setResponses(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          photo_url: photo.url,
          photo_type: isPanoramic ? 'panoramic' : 'standard',
        },
      }));
    }
  };

  const handleSubmit = async () => {
    if (!employeeId) return;

    // Check if all required items are checked
    const requiredItems = checklist.items.filter(item => item.required);
    const missingRequired = requiredItems.filter(item => !responses[item.id]?.checked);

    if (missingRequired.length > 0) {
      alert(`Please complete all required items: ${missingRequired.map(i => i.title).join(', ')}`);
      return;
    }

    setLoading(true);
    try {
      await submitChecklist(
        checklist.id,
        employeeId,
        responses,
        projectId,
        locationId,
        workOrderId
      );
      
      setResponses({});
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = checklist.items.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {} as Record<string, typeof checklist.items>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {checklist.name}
          </DialogTitle>
          {checklist.description && (
            <p className="text-sm text-muted-foreground">
              {checklist.description}
            </p>
          )}
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                {category === 'PPE' && <Shield className="h-4 w-4" />}
                {category === 'Hazards' && <AlertTriangle className="h-4 w-4" />}
                {category}
              </h3>
              
              <div className="space-y-4">
                {items.map((item) => {
                  const response = responses[item.id] || { checked: false };
                  
                  return (
                    <div key={item.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={item.id}
                          checked={response.checked}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange(item.id, !!checked)
                          }
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={item.id} 
                            className="text-sm font-medium cursor-pointer"
                          >
                            {item.title}
                            {item.required && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                Required
                              </Badge>
                            )}
                          </Label>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="ml-6 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePhotoCapture(item.id, false)}
                            disabled={photoLoading || !employeeId}
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            Take Photo
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleGallerySelect(item.id, false)}
                            disabled={photoLoading || !employeeId}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload Photo
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePhotoCapture(item.id, true)}
                            disabled={photoLoading || !employeeId}
                          >
                            <Maximize2 className="h-3 w-3 mr-1" />
                            Take Panoramic
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleGallerySelect(item.id, true)}
                            disabled={photoLoading || !employeeId}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload Panoramic
                          </Button>
                        </div>
                        
                        {response.photo_url && (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Photo captured
                              </Badge>
                              {response.photo_type === 'panoramic' && (
                                <Badge variant="secondary" className="text-xs">
                                  <Maximize2 className="h-3 w-3 mr-1" />
                                  Panoramic
                                </Badge>
                              )}
                            </div>
                            
                            <div 
                              className="relative w-24 h-24 rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setExpandedPhoto(response.photo_url || null)}
                            >
                              <img
                                src={response.photo_url}
                                alt="Checklist item photo"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        )}

                        <Textarea
                          placeholder="Additional notes (optional)"
                          value={response.notes || ''}
                          onChange={(e) => handleNotesChange(item.id, e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Separator className="mt-6" />
            </div>
          ))}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !employeeId}
            >
              {loading ? 'Submitting...' : 'Submit Checklist'}
            </Button>
          </div>
        </div>
      </DialogContent>

      <Dialog open={!!expandedPhoto} onOpenChange={() => setExpandedPhoto(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="relative w-full h-full overflow-auto">
            <img
              src={expandedPhoto || ''}
              alt="Checklist photo"
              className="w-full h-auto"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}