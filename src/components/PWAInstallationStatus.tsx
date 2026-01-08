import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  QrCode, 
  Mail, 
  MessageSquare,
  CheckCircle,
  Circle,
  Share2,
  Download
} from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { usePWA, getPWAInstallationStatus } from '@/hooks/usePWA';
import { PWAInstallButton } from '@/components/PWAInstallButton';

export const PWAInstallationStatus: React.FC = () => {
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();
  const { isInstalled } = usePWA();
  const installStatus = getPWAInstallationStatus();

  const currentUrl = window.location.origin;

  const handleShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Trade Atlas App',
          text: 'Install Trade Atlas on your device',
          url: currentUrl,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(currentUrl);
      toast({
        title: "Link Copied",
        description: "Installation link copied to clipboard",
      });
    }
  };

  const sendViaEmail = () => {
    const subject = encodeURIComponent('Install Trade Atlas App');
    const body = encodeURIComponent(`Install Trade Atlas on your device:\n\n${currentUrl}\n\nFor iOS: Open in Safari, tap Share, then "Add to Home Screen"\nFor Android: Open in Chrome, tap menu, then "Install app"`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const sendViaSMS = () => {
    const message = encodeURIComponent(`Install Trade Atlas: ${currentUrl}`);
    window.open(`sms:?body=${message}`);
  };

  return (
    <div className="space-y-6">
      {/* Current Device Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Current Device Status
          </CardTitle>
          <CardDescription>
            Installation status on this device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {isInstalled ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {isInstalled ? 'Installed' : 'Not Installed'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {installStatus.isStandalone ? 'Running in standalone mode' : 'Running in browser'}
                </p>
              </div>
            </div>
            <Badge variant={isInstalled ? "default" : "secondary"}>
              {installStatus.method === 'ios' ? 'iOS' : installStatus.method === 'web_app_manifest' ? 'PWA' : 'Browser'}
            </Badge>
          </div>

          {!isInstalled && (
            <PWAInstallButton variant="default" className="w-full" />
          )}
        </CardContent>
      </Card>

      {/* Multi-Device Installation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Install on Other Devices
          </CardTitle>
          <CardDescription>
            Each device needs separate installation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="share">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="share">Share</TabsTrigger>
              <TabsTrigger value="qr">QR Code</TabsTrigger>
              <TabsTrigger value="guide">Guide</TabsTrigger>
            </TabsList>

            <TabsContent value="share" className="space-y-3 mt-4">
              <p className="text-sm text-muted-foreground mb-4">
                Send the installation link to your other devices
              </p>
              
              <div className="grid gap-2">
                <Button variant="outline" onClick={handleShareLink} className="justify-start">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
                <Button variant="outline" onClick={sendViaEmail} className="justify-start">
                  <Mail className="w-4 h-4 mr-2" />
                  Send via Email
                </Button>
                <Button variant="outline" onClick={sendViaSMS} className="justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send via SMS
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="qr" className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground">
                Share this URL with your other devices
              </p>
              
              <div className="flex flex-col gap-3 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <code className="text-xs flex-1 truncate">{currentUrl}</code>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(currentUrl);
                      toast({
                        title: "Copied!",
                        description: "URL copied to clipboard",
                      });
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              
              <p className="text-xs text-center text-muted-foreground">
                Open this URL on your other device to install Trade Atlas
              </p>
            </TabsContent>

            <TabsContent value="guide" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Smartphone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">iOS (iPhone/iPad)</p>
                    <ol className="text-xs text-muted-foreground space-y-1 mt-2 list-decimal list-inside">
                      <li>Open this URL in Safari browser</li>
                      <li>Tap the Share button (square with arrow)</li>
                      <li>Scroll and tap "Add to Home Screen"</li>
                      <li>Tap "Add" to confirm</li>
                    </ol>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Smartphone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Android</p>
                    <ol className="text-xs text-muted-foreground space-y-1 mt-2 list-decimal list-inside">
                      <li>Open this URL in Chrome browser</li>
                      <li>Tap the menu (three dots)</li>
                      <li>Select "Install app" or "Add to Home screen"</li>
                      <li>Tap "Install" to confirm</li>
                    </ol>
                  </div>
                </div>

                <div className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <Monitor className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Desktop (Chrome/Edge)</p>
                    <ol className="text-xs text-muted-foreground space-y-1 mt-2 list-decimal list-inside">
                      <li>Look for install icon in address bar</li>
                      <li>Click "Install Trade Atlas"</li>
                      <li>Or use browser menu → "Install Trade Atlas"</li>
                    </ol>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Important Note */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-primary/10 p-2">
                <Download className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">Why install on each device?</p>
              <p className="text-xs text-muted-foreground">
                PWA installations are device-specific and not synced across your devices. 
                Installing on each device ensures you get the best performance, offline access, 
                and native app experience everywhere you work.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
