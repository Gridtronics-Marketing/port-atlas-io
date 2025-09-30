import React, { useState, useEffect } from 'react';
import { X, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePWA } from '@/hooks/usePWA';

export const InAppEducationBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const isMobile = useIsMobile();
  const { isInstalled } = usePWA();

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem('pwa-education-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismiss = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    // Show banner if:
    // - User is on mobile
    // - App is not installed
    // - Banner hasn't been dismissed in the last 7 days
    if (isMobile && !isInstalled && daysSinceDismiss > 7) {
      setShowBanner(true);
    }
  }, [isMobile, isInstalled]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowBanner(false);
    localStorage.setItem('pwa-education-dismissed', Date.now().toString());
  };

  if (!showBanner || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
      <Card className="p-4 shadow-lg border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="rounded-full bg-primary/10 p-2">
              <Smartphone className="w-5 h-5 text-primary" />
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-sm">Install on Each Device</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Port Atlas must be installed separately on each device (phone, tablet, computer) for the best experience.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mt-1"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Monitor className="w-3 h-3" />
              <span>Installed on PC?</span>
              <Smartphone className="w-3 h-3 ml-2" />
              <span>Install here too!</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
