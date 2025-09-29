import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share, Plus, Smartphone } from 'lucide-react';

interface IOSInstallInstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const IOSInstallInstructions: React.FC<IOSInstallInstructionsProps> = ({
  open,
  onOpenChange,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Install Port Atlas on iOS
          </DialogTitle>
          <DialogDescription>
            Follow these steps to add Port Atlas to your home screen
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              1
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Tap the Share button</p>
              <p className="text-sm text-muted-foreground">
                Look for the <Share className="inline w-3 h-3" /> share icon in Safari's bottom toolbar
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              2
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Select "Add to Home Screen"</p>
              <p className="text-sm text-muted-foreground">
                Scroll down and tap "Add to Home Screen" <Plus className="inline w-3 h-3" />
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              3
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Confirm installation</p>
              <p className="text-sm text-muted-foreground">
                Tap "Add" in the top-right corner to complete the installation
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium">Why install?</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Faster access from your home screen</li>
              <li>Works offline with cached data</li>
              <li>Full-screen app experience</li>
              <li>Instant notifications (when enabled)</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
