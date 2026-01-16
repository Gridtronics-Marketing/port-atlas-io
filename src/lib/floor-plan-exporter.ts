import jsPDF from 'jspdf';
import { supabase } from "@/integrations/supabase/client";

export interface ExportOptions {
  title?: string;
  includeDropPoints?: boolean;
  includeRoomViews?: boolean;
  includeMetadata?: boolean;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Export a floor plan to PDF with optional annotations
 */
export async function exportFloorPlanToPDF(
  locationId: string,
  floorNumber: number,
  floorPlanUrl: string,
  options: ExportOptions = {},
  compositeImageUrl?: string
): Promise<void> {
  const {
    title = `Floor ${floorNumber} Plan`,
    includeDropPoints = true,
    includeRoomViews = true,
    includeMetadata = true,
    orientation = 'landscape',
  } = options;

  try {
    // Create PDF with selected orientation
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = pageHeight - (margin * 2);

    // Add title
    pdf.setFontSize(16);
    pdf.text(title, margin, margin + 7);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, margin, margin + 12);

    // Load and add the floor plan image (use composite if provided)
    const imageUrl = compositeImageUrl || floorPlanUrl;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Failed to load floor plan image'));
      img.src = imageUrl;
    });

    // Calculate image dimensions to fit the page
    const imgAspect = img.width / img.height;
    const availableHeight = contentHeight - 30; // Reserve space for title
    let imgWidth = contentWidth;
    let imgHeight = imgWidth / imgAspect;

    if (imgHeight > availableHeight) {
      imgHeight = availableHeight;
      imgWidth = imgHeight * imgAspect;
    }

    const imgX = (pageWidth - imgWidth) / 2;
    const imgY = margin + 20;

    pdf.addImage(img, 'PNG', imgX, imgY, imgWidth, imgHeight);

    // Add metadata if requested
    if (includeMetadata) {
      // Fetch location data
      const { data: location } = await supabase
        .from('locations')
        .select('name, address, floors')
        .eq('id', locationId)
        .single();

      if (location) {
        pdf.addPage();
        pdf.setFontSize(14);
        pdf.text('Location Information', margin, margin + 7);
        
        pdf.setFontSize(10);
        let yPos = margin + 15;
        pdf.text(`Location: ${location.name}`, margin, yPos);
        yPos += 7;
        if (location.address) {
          pdf.text(`Address: ${location.address}`, margin, yPos);
          yPos += 7;
        }
        pdf.text(`Total Floors: ${location.floors || 'N/A'}`, margin, yPos);
        yPos += 7;
        pdf.text(`Current Floor: ${floorNumber}`, margin, yPos);
        yPos += 10;

        // Add drop points summary
        if (includeDropPoints) {
          const { data: dropPoints } = await supabase
            .from('drop_points')
            .select('label, room, status, point_type, cable_count')
            .eq('location_id', locationId)
            .eq('floor', floorNumber);

          if (dropPoints && dropPoints.length > 0) {
            pdf.setFontSize(12);
            pdf.text('Drop Points Summary', margin, yPos);
            yPos += 7;
            
            pdf.setFontSize(9);
            pdf.text(`Total Drop Points: ${dropPoints.length}`, margin, yPos);
            yPos += 7;

            // Group by status
            const statusCounts: Record<string, number> = {};
            dropPoints.forEach(dp => {
              statusCounts[dp.status || 'unknown'] = (statusCounts[dp.status || 'unknown'] || 0) + 1;
            });

            Object.entries(statusCounts).forEach(([status, count]) => {
              pdf.text(`  ${status}: ${count}`, margin + 5, yPos);
              yPos += 5;
            });

            yPos += 5;

            // Add drop point list
            pdf.setFontSize(10);
            pdf.text('Drop Point Details:', margin, yPos);
            yPos += 7;

            pdf.setFontSize(8);
            dropPoints.forEach((dp, index) => {
              if (yPos > pageHeight - margin - 10) {
                pdf.addPage();
                yPos = margin + 10;
              }
              
              const cables = dp.cable_count > 1 ? ` (${dp.cable_count} cables)` : '';
              pdf.text(
                `${index + 1}. ${dp.label}${cables} - ${dp.room || 'N/A'} - ${dp.status} - ${dp.point_type}`,
                margin + 3,
                yPos
              );
              yPos += 5;
            });
          }
        }

        // Add room views summary
        if (includeRoomViews) {
          const { data: roomViews } = await supabase
            .from('room_views')
            .select('room_name, description, floor')
            .eq('location_id', locationId)
            .eq('floor', floorNumber);

          if (roomViews && roomViews.length > 0) {
            yPos += 10;
            if (yPos > pageHeight - margin - 20) {
              pdf.addPage();
              yPos = margin + 10;
            }

            pdf.setFontSize(12);
            pdf.text('Room Views', margin, yPos);
            yPos += 7;
            
            pdf.setFontSize(9);
            pdf.text(`Total Room Views: ${roomViews.length}`, margin, yPos);
            yPos += 7;

            pdf.setFontSize(8);
            roomViews.forEach((rv, index) => {
              if (yPos > pageHeight - margin - 10) {
                pdf.addPage();
                yPos = margin + 10;
              }
              
              pdf.text(
                `${index + 1}. ${rv.room_name || 'Unnamed'} - ${rv.description || 'No description'}`,
                margin + 3,
                yPos
              );
              yPos += 5;
            });
          }
        }
      }
    }

    // Save the PDF
    const fileName = `${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    pdf.save(fileName);
    
  } catch (error) {
    console.error('Error exporting floor plan to PDF:', error);
    throw new Error(`Failed to export PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
