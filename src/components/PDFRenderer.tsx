import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path with fallback
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
} catch (error) {
  console.warn('[PDFRenderer] Failed to set PDF worker, using CDN fallback');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
}

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
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let abortController = new AbortController();

    const testFileAccessibility = async (url: string): Promise<boolean> => {
      try {
        console.log('[PDFRenderer] Testing file accessibility:', url);
        const response = await fetch(url, { 
          method: 'HEAD',
          signal: abortController.signal
        });
        console.log('[PDFRenderer] File accessibility test result:', response.status, response.ok);
        return response.ok;
      } catch (err) {
        console.error('[PDFRenderer] File accessibility test failed:', err);
        return false;
      }
    };

    const renderPDF = async () => {
      // Wait for canvas to be available with retry mechanism
      let retryCount = 0;
      while (!canvasRef.current && retryCount < 10) {
        console.log('[PDFRenderer] Waiting for canvas ref, attempt:', retryCount + 1);
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
      }

      if (!canvasRef.current) {
        console.error('[PDFRenderer] Canvas ref not available after 10 retries');
        setError('Canvas not available for PDF rendering');
        setLoading(false);
        return;
      }

      try {
        console.log('[PDFRenderer] Starting PDF render for:', fileUrl, 'page:', pageNumber);
        setLoading(true);
        setError(null);
        setLoadingProgress(10);

        // Test file accessibility first
        const isAccessible = await testFileAccessibility(fileUrl);
        if (!isAccessible) {
          throw new Error(`PDF file is not accessible at: ${fileUrl}`);
        }
        setLoadingProgress(25);

        // Set loading timeout (15 seconds)
        timeoutId = setTimeout(() => {
          abortController.abort();
          setError('PDF loading timed out. The file might be too large or the connection is slow.');
          setLoading(false);
          console.error('[PDFRenderer] PDF loading timed out after 15 seconds');
        }, 15000);

        console.log('[PDFRenderer] Loading PDF document...');
        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          disableAutoFetch: false,
          disableStream: false
        });

        // Track loading progress
        loadingTask.onProgress = (progress) => {
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 50) + 25; // 25-75%
            setLoadingProgress(percent);
            console.log('[PDFRenderer] Loading progress:', percent + '%');
          }
        };

        const pdf = await loadingTask.promise;
        console.log('[PDFRenderer] PDF loaded successfully. Total pages:', pdf.numPages);
        setTotalPages(pdf.numPages);
        setLoadingProgress(80);

        // Validate page number
        let validPageNumber = pageNumber;
        if (pageNumber < 1 || pageNumber > pdf.numPages) {
          console.warn(`[PDFRenderer] Invalid page number ${pageNumber}. PDF has ${pdf.numPages} pages. Using page 1.`);
          validPageNumber = 1;
        }

        console.log('[PDFRenderer] Rendering page:', validPageNumber);
        const page = await pdf.getPage(validPageNumber);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error('Canvas element became unavailable during rendering');
        }
        
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Could not get canvas 2D context');
        }

        canvas.height = viewport.height;
        canvas.width = viewport.width;
        setLoadingProgress(90);

        console.log('[PDFRenderer] Starting page render...');
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        }).promise;

        console.log('[PDFRenderer] PDF page rendered successfully');
        onCanvasReady?.(canvas);
        setLoadingProgress(100);
        setLoading(false);
        clearTimeout(timeoutId);
      } catch (err) {
        clearTimeout(timeoutId);
        console.error('[PDFRenderer] Error rendering PDF:', {
          error: err,
          fileUrl,
          pageNumber,
          message: err instanceof Error ? err.message : String(err)
        });
        
        let errorMessage = 'Failed to render PDF';
        if (err instanceof Error) {
          if (err.message.includes('not accessible')) {
            errorMessage = 'PDF file not found or not accessible';
          } else if (err.message.includes('timeout') || err.message.includes('aborted')) {
            errorMessage = 'PDF loading timed out';
          } else if (err.message.includes('Invalid PDF')) {
            errorMessage = 'Invalid or corrupted PDF file';
          } else if (err.message.includes('page')) {
            errorMessage = `Invalid page number (${pageNumber})`;
          } else {
            errorMessage = `PDF Error: ${err.message}`;
          }
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    // Small delay to ensure canvas is mounted
    const initRender = setTimeout(() => {
      renderPDF();
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initRender);
      abortController.abort();
    };
  }, [fileUrl, pageNumber, scale, onCanvasReady]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 bg-muted rounded-lg ${className}`}>
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <div>
            <p className="text-sm text-muted-foreground">Loading PDF...</p>
            <div className="w-32 bg-muted-foreground/20 rounded-full h-2 mx-auto mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{loadingProgress}%</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center p-8 bg-muted rounded-lg ${className}`}>
        <div className="text-center space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground">File: {fileUrl}</p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => window.location.reload()} 
              className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90"
            >
              Retry
            </button>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded hover:bg-muted/90"
            >
              Download
            </a>
          </div>
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