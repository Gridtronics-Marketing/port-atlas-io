import React, { useState } from 'react';
import { Download, CheckCircle, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePWA } from '@/hooks/usePWA';
import { useToast } from '@/hooks/use-toast';
import { IOSInstallInstructions } from './IOSInstallInstructions';

interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'ghost',
  size = 'default',
  showLabel = true,
  className = '',
}) => {
  const { isInstalled, canInstall, installPrompt } = usePWA();
  const { toast } = useToast();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Enhanced iOS/iPadOS detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
    (navigator.platform === 'iPad' && navigator.maxTouchPoints > 1);
  
  // Check if running in Safari (required for iOS PWA installation)
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);

  const handleInstallClick = async () => {
    // For iOS, show instructions modal
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    // For Android/Chrome, use install prompt
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        
        if (outcome === 'accepted') {
          toast({
            title: "Installing...",
            description: "Port Atlas is being added to your device.",
          });
        }
      } catch (error) {
        console.error('Install error:', error);
        toast({
          title: "Installation Error",
          description: "Unable to install the app.",
          variant: "destructive",
        });
      }
    }
  };

  // Don't show if already installed
  if (isInstalled) {
    if (!showLabel) return null;
    
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        {showLabel && <span>Installed</span>}
      </Button>
    );
  }

  // Show install button if can install or is iOS
  if (canInstall || isIOS) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          onClick={handleInstallClick}
          className={className}
        >
          <Download className="h-4 w-4 mr-2" />
          {showLabel && <span>Install App</span>}
          {isIOS && showLabel && (
            <Badge variant="secondary" className="ml-2 text-xs">
              {isSafari ? 'iOS' : 'Use Safari'}
            </Badge>
          )}
        </Button>
        
        {isIOS && (
          <IOSInstallInstructions
            open={showIOSInstructions}
            onOpenChange={setShowIOSInstructions}
            isSafari={isSafari}
          />
        )}
      </>
    );
  }

  return null;
};
