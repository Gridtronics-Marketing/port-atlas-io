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
  isSafari?: boolean;
}

export const IOSInstallInstructions: React.FC<IOSInstallInstructionsProps> = ({
  open,
  onOpenChange,
  isSafari = true,
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
          {/* Safari Warning */}
          {!isSafari && (
            <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4 space-y-2">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                ⚠️ Safari Required
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500">
                iOS requires Safari browser to install web apps. Please open Port Atlas in Safari to install.
              </p>
            </div>
          )}

          {/* Installation Steps */}
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              1
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Tap the Share button</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Look for the</span>
                <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary/10">
                  <Share className="w-3 h-3 text-primary" />
                </div>
                <span>icon in Safari's toolbar</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Usually found at the bottom on iPhone or top on iPad
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              2
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Select "Add to Home Screen"</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Scroll down and tap</span>
                <div className="inline-flex items-center justify-center w-6 h-6 rounded bg-primary/10">
                  <Plus className="w-3 h-3 text-primary" />
                </div>
                <span>"Add to Home Screen"</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                You may need to scroll the options menu to find it
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              3
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Confirm installation</p>
              <p className="text-sm text-muted-foreground">
                Tap "Add" in the top-right corner to complete the installation
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                The app icon will appear on your home screen
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 p-4 space-y-2 border border-primary/10">
            <p className="text-sm font-medium flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              Why install?
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Lightning-fast access from your home screen</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Works offline with cached data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Full-screen immersive app experience</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Native-like performance and features</span>
              </li>
            </ul>
          </div>

          {/* Troubleshooting */}
          <div className="rounded-lg bg-muted p-3 space-y-2">
            <p className="text-xs font-medium">Troubleshooting</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Make sure you're using Safari browser</li>
              <li>• If you don't see the Share button, try rotating your device</li>
              <li>• Already installed? Check your home screen for the Port Atlas icon</li>
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
