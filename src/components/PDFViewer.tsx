import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, ExternalLink, ZoomIn, ZoomOut } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
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

  if (hasError) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4" style={{ height }}>
          <FileText className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">PDF Preview Not Available</h3>
            <p className="text-sm text-muted-foreground">
              Unable to display PDF inline. Use the buttons below to view or download.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={openInNewTab} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
            <Button variant="default" onClick={downloadPDF} className="flex items-center gap-2">
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
          {isLoading && (
            <div 
              className="flex items-center justify-center bg-muted"
              style={{ height }}
            >
              <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground">Loading PDF...</p>
              </div>
            </div>
          )}
          
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            style={{ 
              width: '100%', 
              height,
              display: isLoading ? 'none' : 'block'
            }}
            onLoad={handleLoad}
            onError={handleError}
            title={fileName}
            className="border-0 rounded-lg"
          />
        </CardContent>
      </Card>
    </div>
  );
};