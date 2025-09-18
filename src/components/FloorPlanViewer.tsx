import { PDFRenderer } from "./PDFRenderer";

interface FloorPlanViewerProps {
  fileUrl: string;
  fileName: string;
  floorNumber: number;
  className?: string;
}

export const FloorPlanViewer = ({ 
  fileUrl, 
  fileName, 
  floorNumber, 
  className = "" 
}: FloorPlanViewerProps) => {
  // Determine file type from URL or fileName
  const getFileExtension = (url: string, name: string) => {
    // Try to get extension from fileName first, then from URL
    const nameExt = name.split('.').pop()?.toLowerCase();
    if (nameExt) return nameExt;
    
    const urlExt = url.split('.').pop()?.toLowerCase().split('?')[0];
    return urlExt || '';
  };

  const fileExtension = getFileExtension(fileUrl, fileName);
  const isPDF = fileExtension === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'bmp', 'tiff'].includes(fileExtension);

  if (isPDF) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Floor {floorNumber} Plan - {fileName}</span>
        </div>
        <PDFRenderer
          fileUrl={fileUrl}
          pageNumber={1}
          scale={1.0}
          className="w-full"
        />
      </div>
    );
  }

  if (isImage) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Floor {floorNumber} Plan</span>
        </div>
        <div className="border rounded-lg overflow-hidden bg-white">
          <img
            src={fileUrl}
            alt={`Floor ${floorNumber} plan`}
            className="w-full h-auto max-h-[600px] object-contain"
            onError={(e) => {
              console.error("Failed to load floor plan image:", fileUrl);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    );
  }

  // Fallback for unknown file types
  return (
    <div className={`w-full ${className}`}>
      <div className="border rounded-lg p-8 text-center bg-muted">
        <p className="text-muted-foreground">
          Unsupported file format: {fileExtension}
        </p>
        <a 
          href={fileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Download File
        </a>
      </div>
    </div>
  );
};