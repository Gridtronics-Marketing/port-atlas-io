import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, ExternalLink } from "lucide-react";

interface PDFViewerProps {
  pdfUrl: string;
  fileName?: string;
  height?: string;
  className?: string;
}

export const PDFViewer = ({ 
  pdfUrl, 
  fileName = "Floor Plan", 
  height = "600px",
  className = "" 
}: PDFViewerProps) => {
  const [showFallback, setShowFallback] = useState(false);

  // Auto-show fallback after 2 seconds if PDF doesn't load (Chrome blocking)
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleLoad = () => {
    // PDF loaded successfully, keep showing it
  };

  const handleError = () => {
    setShowFallback(true);
  };

  const openInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  const downloadPDF = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (showFallback) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4" style={{ height }}>
          <FileText className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">PDF Preview Blocked</h3>
            <p className="text-sm text-muted-foreground">
              Chrome security settings prevent PDF display. Use the options below to view the file.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="default" onClick={openInNewTab} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
            <Button variant="outline" onClick={downloadPDF} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{fileName}</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={openInNewTab}
            className="flex items-center gap-1"
            title="Open in new tab"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadPDF}
            className="flex items-center gap-1"
            title="Download PDF"
          >
            <Download className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <Card className="w-full">
        <CardContent className="p-0">
          <object
            data={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            type="application/pdf"
            style={{ width: '100%', height }}
            onLoad={handleLoad}
            onError={handleError}
            title={fileName}
            className="border-0 rounded-lg"
          >
            <div 
              className="flex items-center justify-center bg-muted"
              style={{ height }}
            >
              <div className="flex flex-col items-center space-y-2">
                <FileText className="h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          </object>
        </CardContent>
      </Card>
    </div>
  );
};