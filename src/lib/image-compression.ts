/**
 * Image compression utility for faster uploads
 * Resizes and compresses images before upload to reduce file size
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp';
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  wasCompressed: boolean;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 2000,
  maxHeight: 2000,
  quality: 0.85,
  format: 'jpeg',
};

/**
 * Check if a file is an image that can be compressed
 */
function isCompressibleImage(file: File): boolean {
  const compressibleTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
  return compressibleTypes.includes(file.type.toLowerCase());
}

/**
 * Load an image from a File object
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  // If image is smaller than max dimensions, return original
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const aspectRatio = width / height;

  if (width > height) {
    // Landscape
    const newWidth = Math.min(width, maxWidth);
    return {
      width: newWidth,
      height: Math.round(newWidth / aspectRatio),
    };
  } else {
    // Portrait or square
    const newHeight = Math.min(height, maxHeight);
    return {
      width: Math.round(newHeight * aspectRatio),
      height: newHeight,
    };
  }
}

/**
 * Compress an image file
 * Returns the original file if it's not a compressible image type
 */
export async function compressImage(
  file: File,
  options?: CompressionOptions
): Promise<CompressionResult> {
  const originalSize = file.size;

  // Return original if not a compressible image
  if (!isCompressibleImage(file)) {
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      wasCompressed: false,
    };
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    // Load the image
    const img = await loadImage(file);
    
    // Clean up the object URL
    URL.revokeObjectURL(img.src);

    // Calculate new dimensions
    const { width, height } = calculateDimensions(
      img.naturalWidth,
      img.naturalHeight,
      opts.maxWidth,
      opts.maxHeight
    );

    // If no resizing needed and file is already small, skip compression
    if (
      width === img.naturalWidth &&
      height === img.naturalHeight &&
      file.size < 500 * 1024 // Less than 500KB
    ) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        wasCompressed: false,
      };
    }

    // Create canvas and draw resized image
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Use better quality interpolation
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw the image
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    const mimeType = opts.format === 'webp' ? 'image/webp' : 'image/jpeg';
    
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        },
        mimeType,
        opts.quality
      );
    });

    // Create new file with appropriate extension
    const originalName = file.name.replace(/\.[^/.]+$/, '');
    const extension = opts.format === 'webp' ? 'webp' : 'jpg';
    const compressedFile = new File(
      [blob],
      `${originalName}.${extension}`,
      { type: mimeType }
    );

    // If compressed file is larger than original, return original
    if (compressedFile.size >= file.size) {
      return {
        file,
        originalSize,
        compressedSize: originalSize,
        wasCompressed: false,
      };
    }

    return {
      file: compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
      wasCompressed: true,
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original file on error
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      wasCompressed: false,
    };
  }
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
