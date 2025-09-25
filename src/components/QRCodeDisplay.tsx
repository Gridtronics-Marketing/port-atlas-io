import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Download, Printer, Copy, Check } from 'lucide-react';
import { generateQRCodeDataURL, downloadQRCode, printQRCode } from '@/lib/qr-code-utils';
import { useToast } from '@/hooks/use-toast';

interface QRCodeDisplayProps {
  type: 'drop_point' | 'backbone_cable' | 'distribution_frame' | 'work_order' | 'location';
  id: string;
  locationId?: string;
  metadata?: Record<string, any>;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showButtons?: boolean;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  type,
  id,
  locationId,
  metadata,
  label,
  size = 'md',
  showButtons = true
}) => {
  const [qrCodeDataURL, setQRCodeDataURL] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const sizeMap = {
    sm: 120,
    md: 200,
    lg: 300
  };

  const qrSize = sizeMap[size];

  useEffect(() => {
    generateQR();
  }, [type, id, locationId, metadata]);

  const generateQR = async () => {
    try {
      setLoading(true);
      const dataURL = await generateQRCodeDataURL(
        { type, id, locationId, metadata },
        { size: qrSize }
      );
      setQRCodeDataURL(dataURL);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      await downloadQRCode(
        { type, id, locationId, metadata },
        `qr-${type}-${label || id}.svg`
      );
      toast({
        title: "Success",
        description: "QR code downloaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive"
      });
    }
  };

  const handlePrint = async () => {
    try {
      await printQRCode({ type, id, locationId, metadata });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to print QR code",
        variant: "destructive"
      });
    }
  };

  const handleCopyURL = async () => {
    try {
      const componentURL = `${window.location.origin}/component/${type}/${id}`;
      await navigator.clipboard.writeText(componentURL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Success",
        description: "Component URL copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy URL",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size={size === 'sm' ? 'sm' : 'default'}>
              <QrCode className="h-4 w-4 mr-2" />
              {size === 'sm' ? 'QR' : 'View QR Code'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code - {label || id}
              </DialogTitle>
              <DialogDescription>
                Scan this QR code to quickly access this {type.replace('_', ' ')} information
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-center p-6 bg-white rounded-lg border">
                <img 
                  src={qrCodeDataURL} 
                  alt="QR Code"
                  className="max-w-full"
                  style={{ width: qrSize, height: qrSize }}
                />
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                <p><strong>Type:</strong> {type.replace('_', ' ').toUpperCase()}</p>
                <p><strong>ID:</strong> {id}</p>
                {locationId && <p><strong>Location:</strong> {locationId}</p>}
              </div>

              {showButtons && (
                <div className="flex gap-2 justify-center">
                  <Button size="sm" variant="outline" onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" variant="outline" onClick={handlePrint}>
                    <Printer className="h-4 w-4 mr-1" />
                    Print
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCopyURL}>
                    {copied ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copied ? 'Copied!' : 'Copy URL'}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};