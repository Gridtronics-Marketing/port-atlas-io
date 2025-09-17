import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Camera, AlertTriangle } from 'lucide-react';
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
  const { capturePhoto, loading: photoLoading } = usePhotoCapture();
  
  const [responses, setResponses] = useState<Record<string, {
    checked: boolean;
    notes?: string;
    photo_url?: string;
  }>>({});
  const [loading, setLoading] = useState(false);

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

  const handlePhotoCapture = async (itemId: string) => {
    if (!employeeId) return;
    
    const photo = await capturePhoto(
      'safety-checklist',
      `${checklist.name} - ${checklist.items.find(i => i.id === itemId)?.title}`,
      projectId,
      locationId,
      workOrderId,
      employeeId
    );

    if (photo) {
      setResponses(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          photo_url: photo.url,
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
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handlePhotoCapture(item.id)}
                            disabled={photoLoading || !employeeId}
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            {response.photo_url ? 'Retake Photo' : 'Add Photo'}
                          </Button>
                          
                          {response.photo_url && (
                            <Badge variant="secondary" className="text-xs">
                              Photo captured
                            </Badge>
                          )}
                        </div>

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
    </Dialog>
  );
}