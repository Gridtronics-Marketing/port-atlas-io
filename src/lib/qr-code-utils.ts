interface QRCodeData {
  type: 'drop_point' | 'backbone_cable' | 'distribution_frame' | 'work_order' | 'location';
  id: string;
  locationId?: string;
  metadata?: Record<string, any>;
}

interface QRCodeOptions {
  size?: number;
  logo?: string;
  backgroundColor?: string;
  foregroundColor?: string;
}

/**
 * Generate QR code data URL for a component
 */
export const generateQRCodeDataURL = async (
  data: QRCodeData, 
  options: QRCodeOptions = {}
): Promise<string> => {
  const {
    size = 200,
    backgroundColor = '#ffffff',
    foregroundColor = '#000000'
  } = options;

  // Create the data string to encode
  const qrData = JSON.stringify({
    ...data,
    url: `${window.location.origin}/component/${data.type}/${data.id}`,
    timestamp: new Date().toISOString()
  });

  // For now, return a placeholder data URL
  // In a real implementation, you would use a QR code library like qrcode.js
  return `data:image/svg+xml,${encodeURIComponent(
    generateQRCodeSVG(qrData, size, foregroundColor, backgroundColor)
  )}`;
};

/**
 * Generate a simple QR code SVG (placeholder implementation)
 */
const generateQRCodeSVG = (
  data: string, 
  size: number, 
  foregroundColor: string, 
  backgroundColor: string
): string => {
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${backgroundColor}"/>
      <rect x="10" y="10" width="20" height="20" fill="${foregroundColor}"/>
      <rect x="40" y="10" width="20" height="20" fill="${foregroundColor}"/>
      <rect x="70" y="10" width="20" height="20" fill="${foregroundColor}"/>
      <rect x="10" y="40" width="20" height="20" fill="${foregroundColor}"/>
      <rect x="70" y="40" width="20" height="20" fill="${foregroundColor}"/>
      <rect x="10" y="70" width="20" height="20" fill="${foregroundColor}"/>
      <rect x="40" y="70" width="20" height="20" fill="${foregroundColor}"/>
      <rect x="70" y="70" width="20" height="20" fill="${foregroundColor}"/>
      <text x="${size/2}" y="${size - 20}" text-anchor="middle" font-size="12" fill="${foregroundColor}">
        QR Code
      </text>
    </svg>
  `;
};

/**
 * Generate QR code for drop point
 */
export const generateDropPointQR = async (
  dropPointId: string, 
  locationId: string,
  metadata?: Record<string, any>
): Promise<string> => {
  return generateQRCodeDataURL({
    type: 'drop_point',
    id: dropPointId,
    locationId,
    metadata
  });
};

/**
 * Generate QR code for backbone cable
 */
export const generateBackboneCableQR = async (
  cableId: string, 
  locationId: string,
  metadata?: Record<string, any>
): Promise<string> => {
  return generateQRCodeDataURL({
    type: 'backbone_cable',
    id: cableId,
    locationId,
    metadata
  });
};

/**
 * Generate QR code for distribution frame
 */
export const generateDistributionFrameQR = async (
  frameId: string, 
  locationId: string,
  metadata?: Record<string, any>
): Promise<string> => {
  return generateQRCodeDataURL({
    type: 'distribution_frame',
    id: frameId,
    locationId,
    metadata
  });
};

/**
 * Generate QR code for work order
 */
export const generateWorkOrderQR = async (
  workOrderId: string,
  metadata?: Record<string, any>
): Promise<string> => {
  return generateQRCodeDataURL({
    type: 'work_order',
    id: workOrderId,
    metadata
  });
};

/**
 * Generate QR code for location
 */
export const generateLocationQR = async (
  locationId: string,
  metadata?: Record<string, any>
): Promise<string> => {
  return generateQRCodeDataURL({
    type: 'location',
    id: locationId,
    metadata
  });
};

/**
 * Parse QR code data from scanned text
 */
export const parseQRCodeData = (qrText: string): QRCodeData | null => {
  try {
    const data = JSON.parse(qrText);
    if (data.type && data.id) {
      return data as QRCodeData;
    }
  } catch (error) {
    // Try to parse as URL
    if (qrText.includes('/component/')) {
      const urlParts = qrText.split('/component/');
      if (urlParts.length === 2) {
        const [type, id] = urlParts[1].split('/');
        return {
          type: type as QRCodeData['type'],
          id
        };
      }
    }
  }
  return null;
};

/**
 * Get component URL from QR data
 */
export const getComponentURL = (data: QRCodeData): string => {
  return `/component/${data.type}/${data.id}`;
};

/**
 * Download QR code as image
 */
export const downloadQRCode = async (
  data: QRCodeData, 
  filename?: string,
  options?: QRCodeOptions
): Promise<void> => {
  const dataURL = await generateQRCodeDataURL(data, options);
  
  const link = document.createElement('a');
  link.download = filename || `qr-${data.type}-${data.id}.svg`;
  link.href = dataURL;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Print QR code
 */
export const printQRCode = async (
  data: QRCodeData,
  options?: QRCodeOptions
): Promise<void> => {
  const dataURL = await generateQRCodeDataURL(data, options);
  
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${data.type} ${data.id}</title>
          <style>
            body { margin: 0; padding: 20px; text-align: center; }
            img { max-width: 100%; }
            .info { margin-top: 20px; font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <img src="${dataURL}" alt="QR Code">
          <div class="info">
            <h3>${data.type.replace('_', ' ').toUpperCase()}</h3>
            <p>ID: ${data.id}</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
};