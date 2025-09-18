import * as pdfjsLib from 'pdfjs-dist';

// Set worker path - use CDN to ensure version compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.js`;

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
    
    // Load the PDF
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
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