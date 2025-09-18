import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFRendererProps {
  fileUrl: string;
  pageNumber?: number;
  scale?: number;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  className?: string;
}

export const PDFRenderer = ({ 
  fileUrl, 
  pageNumber = 1, 
  scale = 1.0,
  onCanvasReady,
  className = "" 
}: PDFRendererProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const renderPDF = async () => {
      if (!canvasRef.current) return;

      try {
        setLoading(true);
        setError(null);

        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        setTotalPages(pdf.numPages);

        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) {
          throw new Error('Could not get canvas context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        }).promise;

        onCanvasReady?.(canvas);
        setLoading(false);
      } catch (err) {
        console.error('Error rendering PDF:', err);
        setError('Failed to render PDF');
        setLoading(false);
      }
    };

    renderPDF();
  }, [fileUrl, pageNumber, scale, onCanvasReady]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 bg-muted rounded-lg ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 bg-muted rounded-lg ${className}`}>
        <div className="text-center">
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground mt-1">Try refreshing or use a different file</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="max-w-full h-auto border rounded-lg shadow-sm"
        style={{ display: 'block' }}
      />
      {totalPages > 1 && (
        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
          Page {pageNumber} of {totalPages}
        </div>
      )}
    </div>
  );
};