import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LabelPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string) => void;
  initialText?: string;
  isEditing?: boolean;
}

export const LabelPromptDialog = ({
  isOpen,
  onClose,
  onSave,
  initialText = '',
  isEditing = false,
}: LabelPromptDialogProps) => {
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
    }
  }, [isOpen, initialText]);

  const handleSave = () => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      return;
    }
    onSave(trimmed);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Label' : 'Add Label'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="labelText">Label Text</Label>
            <Input
              id="labelText"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter label text..."
              autoFocus
              maxLength={100}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={text.trim().length === 0}>
            {isEditing ? 'Save' : 'Place Label'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
