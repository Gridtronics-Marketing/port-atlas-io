import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface TextEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (text: string, fontSize: number, color: string) => void;
  initialText?: string;
  initialFontSize?: number;
  initialColor?: string;
}

export const TextEditDialog = ({
  isOpen,
  onClose,
  onSave,
  initialText = 'Enter text here',
  initialFontSize = 16,
  initialColor = '#000000'
}: TextEditDialogProps) => {
  const [text, setText] = useState(initialText);
  const [fontSize, setFontSize] = useState(initialFontSize);
  const [color, setColor] = useState(initialColor);

  useEffect(() => {
    if (isOpen) {
      setText(initialText);
      setFontSize(initialFontSize);
      setColor(initialColor);
    }
  }, [isOpen, initialText, initialFontSize, initialColor]);

  const handleSave = () => {
    onSave(text, fontSize, color);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Text</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="text">Text</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your text..."
              autoFocus
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="fontSize">Font Size: {fontSize}px</Label>
            <Slider
              id="fontSize"
              min={8}
              max={72}
              step={1}
              value={[fontSize]}
              onValueChange={(value) => setFontSize(value[0])}
              className="w-full"
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex items-center gap-2">
              <input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-12 h-8 rounded border"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
          </div>
          
          <div className="mt-2 p-2 border rounded bg-muted/50">
            <div className="text-sm text-muted-foreground mb-2">Preview:</div>
            <div 
              style={{ 
                fontSize: `${fontSize}px`, 
                color: color,
                fontFamily: 'inherit'
              }}
            >
              {text || 'Enter text here'}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};