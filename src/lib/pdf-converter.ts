import * as pdfjsLib from 'pdfjs-dist';

// Configure worker to use the local file from pdfjs-dist package
// This ensures version compatibility between the library and worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

export interface ConvertedPage {
  pageNumber: number;
  blob: Blob;
  fileName: string;
}

export interface ConversionProgress {
  currentPage: number;
  totalPages: number;
  progress: number; // 0-100
}

/**
 * Convert a PDF file to PNG images, one per page
 */
export const convertPDFToImages = async (
  file: File,
  onProgress?: (progress: ConversionProgress) => void
): Promise<ConvertedPage[]> => {
  try {
    console.log('[PDF Converter] Starting conversion for:', file.name);
    
    // Validate file
    if (!file || file.size === 0) {
      throw new Error('Invalid or empty PDF file');
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      throw new Error('PDF file is too large (maximum 50MB)');
    }
    
    // Load the PDF with timeout
    const arrayBuffer = await file.arrayBuffer();
    
    if (arrayBuffer.byteLength === 0) {
      throw new Error('PDF file appears to be empty');
    }

    console.log('[PDF Converter] File size:', arrayBuffer.byteLength, 'bytes');
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      maxImageSize: -1,
      disableAutoFetch: true,
      disableStream: true
    });
    
    // Add timeout for loading
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('PDF loading timeout')), 30000)
    );
    
    const pdf = await Promise.race([loadingTask.promise, timeoutPromise]) as any;
    
    console.log('[PDF Converter] PDF loaded, pages:', pdf.numPages);
    
    const convertedPages: ConvertedPage[] = [];
    
    // Convert each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Set up canvas with appropriate scale for good quality
      const scale = 2.0; // Higher scale for better quality
      const viewport = page.getViewport({ scale });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas 2D context');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      // Render the page
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      };
      
      await page.render(renderContext).promise;
      
      // Convert canvas to PNG blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          'image/png',
          0.95 // High quality
        );
      });
      
      // Generate filename (remove .pdf and add page number and .png)
      const baseName = file.name.replace(/\.pdf$/i, '');
      const fileName = `${baseName}_page_${pageNum}.png`;
      
      convertedPages.push({
        pageNumber: pageNum,
        blob,
        fileName
      });
      
      // Report progress
      if (onProgress) {
        onProgress({
          currentPage: pageNum,
          totalPages: pdf.numPages,
          progress: Math.round((pageNum / pdf.numPages) * 100)
        });
      }
      
      console.log(`[PDF Converter] Converted page ${pageNum}/${pdf.numPages}`);
    }
    
    console.log('[PDF Converter] Conversion complete');
    return convertedPages;
    
  } catch (error) {
    console.error('[PDF Converter] Error during conversion:', error);
    throw new Error(`Failed to convert PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Check if a file is a PDF
 */
export const isPDFFile = (file: File): boolean => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
};

/**
 * Check if a file is an image
 */
export const isImageFile = (file: File): boolean => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'];
  const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'bmp', 'tiff'];
  
  return imageTypes.includes(file.type) || 
         imageExtensions.some(ext => file.name.toLowerCase().endsWith(`.${ext}`));
};