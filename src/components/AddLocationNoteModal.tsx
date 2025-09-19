import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

interface AddLocationNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  onNoteAdded: () => void;
}

export const AddLocationNoteModal = ({ 
  isOpen, 
  onClose, 
  locationId, 
  onNoteAdded 
}: AddLocationNoteModalProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "general"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and content",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Create a daily log entry with the note
      const { error } = await supabase
        .from('daily_logs')
        .insert([{
          location_id: locationId,
          log_date: new Date().toISOString().split('T')[0],
          employee_id: (await supabase.auth.getUser()).data.user?.id,
          hours_worked: 0,
          work_description: `${formData.title}: ${formData.content}`,
          materials_used: { note_category: formData.category },
          crew_members: []
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note added successfully",
      });

      // Reset form
      setFormData({
        title: "",
        content: "",
        category: "general"
      });

      onNoteAdded();
      onClose();
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Location Note
          </DialogTitle>
          <DialogDescription>
            Add important notes and observations for this location.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter note title"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="Enter note details..."
              rows={4}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              disabled={isLoading}
            >
              <option value="general">General</option>
              <option value="access">Access Requirements</option>
              <option value="safety">Safety Notes</option>
              <option value="technical">Technical Details</option>
              <option value="client">Client Communication</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};