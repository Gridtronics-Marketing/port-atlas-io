import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, FileSpreadsheet, Image, FileImage, Printer, Settings } from 'lucide-react';
import { useBackboneCables } from '@/hooks/useBackboneCables';
import { useDistributionFrames } from '@/hooks/useDistributionFrames';
import { usePatchConnections } from '@/hooks/usePatchConnections';
import { useDocumentationFiles } from '@/hooks/useDocumentationFiles';
import { useToast } from '@/hooks/use-toast';

interface EnhancedExportManagerProps {
  locationId: string;
  locationName: string;
}

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  includeImages: boolean;
  includeTestResults: boolean;
  includeConnections: boolean;
  includeCapacityData: boolean;
  compliance: 'TIA-568' | 'BICSI' | 'ISO-11801' | 'Custom';
  template: 'standard' | 'detailed' | 'executive' | 'compliance';
}

export const EnhancedExportManager: React.FC<EnhancedExportManagerProps> = ({
  locationId,
  locationName
}) => {
  const { cables } = useBackboneCables(locationId);
  const { frames } = useDistributionFrames(locationId);
  const { connections } = usePatchConnections(locationId);
  const { files } = useDocumentationFiles(locationId);
  const { toast } = useToast();

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeImages: true,
    includeTestResults: true,
    includeConnections: true,
    includeCapacityData: true,
    compliance: 'TIA-568',
    template: 'standard'
  });

  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportTypes = [
    {
      id: 'riser_diagram',
      name: 'Riser Diagram',
      description: 'Complete riser diagram with equipment and connections',
      icon: <FileImage className="h-5 w-5" />,
      formats: ['pdf', 'png', 'svg']
    },
    {
      id: 'port_mapping',
      name: 'Port Mapping Report',
      description: 'Detailed port-to-port connection mappings',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      formats: ['excel', 'csv', 'pdf']
    },
    {
      id: 'as_built',
      name: 'As-Built Documentation',
      description: 'Complete as-built drawings and specifications',
      icon: <FileText className="h-5 w-5" />,
      formats: ['pdf', 'zip']
    },
    {
      id: 'compliance_report',
      name: 'Compliance Report',
      description: 'Standards compliance documentation and certificates',
      icon: <Badge className="h-5 w-5" />,
      formats: ['pdf', 'docx']
    },
    {
      id: 'capacity_analysis',
      name: 'Capacity Analysis',
      description: 'Current utilization and future capacity planning',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      formats: ['excel', 'pdf', 'csv']
    },
    {
      id: 'test_results',
      name: 'Test Results Summary',
      description: 'Cable testing results and certifications',
      icon: <FileText className="h-5 w-5" />,
      formats: ['pdf', 'excel', 'csv']
    }
  ];

  const handleExport = async (exportType: string) => {
    setExporting(true);
    try {
      let blob: Blob;
      let fileExtension: string;

      if (exportOptions.format === 'pdf') {
        // Generate actual PDF document
        const pdfBlob = await generatePDFDocument(exportType);
        blob = pdfBlob;
        fileExtension = 'pdf';
      } else {
        // Create text-based file content
        const exportData = generateExportData(exportType);
        blob = new Blob([exportData], { 
          type: getContentType(exportOptions.format) 
        });
        fileExtension = exportOptions.format;
      }
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${locationName.replace(/[^a-z0-9]/gi, '_')}-${exportType}-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${exportType.replace(/_/g, ' ')} exported successfully as ${exportOptions.format.toUpperCase()}`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed", 
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  const generatePDFDocument = async (exportType: string): Promise<Blob> => {
    // Import jsPDF dynamically
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF();
    
    const timestamp = new Date().toISOString();
    const date = new Date().toLocaleDateString();
    
    // Header
    pdf.setFontSize(20);
    pdf.text(`${exportType.replace(/_/g, ' ').toUpperCase()} REPORT`, 20, 20);
    
    pdf.setFontSize(12);
    pdf.text(`Location: ${locationName}`, 20, 35);
    pdf.text(`Generated: ${date}`, 20, 45);
    pdf.text(`Compliance: ${exportOptions.compliance}`, 20, 55);
    
    let yPosition = 75;
    
    // Summary Section
    pdf.setFontSize(16);
    pdf.text('SUMMARY', 20, yPosition);
    yPosition += 15;
    
    pdf.setFontSize(10);
    pdf.text(`Total Cables: ${cables.length}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Total Distribution Frames: ${frames.length}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Total Connections: ${connections.length}`, 20, yPosition);
    yPosition += 8;
    pdf.text(`Documentation Files: ${files.length}`, 20, yPosition);
    yPosition += 20;
    
    // Backbone Cables Section
    if (cables.length > 0) {
      pdf.setFontSize(14);
      pdf.text('BACKBONE CABLES', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(8);
      const headers = ['Label', 'Type', 'Origin', 'Destination', 'Capacity', 'Used', 'Utilization'];
      const colWidths = [25, 20, 30, 30, 20, 15, 25];
      let xPosition = 20;
      
      // Table headers
      headers.forEach((header, index) => {
        pdf.text(header, xPosition, yPosition);
        xPosition += colWidths[index];
      });
      yPosition += 10;
      
      // Table data
      cables.forEach(cable => {
        if (yPosition > 270) {
          pdf.addPage();
          yPosition = 20;
        }
        
        xPosition = 20;
        const utilization = cable.capacity_total ? 
          `${Math.round((cable.capacity_used / cable.capacity_total) * 100)}%` : 'N/A';
          
        const row = [
          cable.cable_label || 'N/A',
          cable.cable_type.toUpperCase(),
          cable.origin_equipment || 'N/A',
          cable.destination_equipment || 'N/A',
          cable.capacity_total?.toString() || 'N/A',
          cable.capacity_used.toString(),
          utilization
        ];
        
        row.forEach((cell, index) => {
          pdf.text(cell, xPosition, yPosition);
          xPosition += colWidths[index];
        });
        yPosition += 6;
      });
      yPosition += 15;
    }
    
    // Distribution Frames Section
    if (frames.length > 0) {
      if (yPosition > 200) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(14);
      pdf.text('DISTRIBUTION FRAMES', 20, yPosition);
      yPosition += 15;
      
      frames.forEach(frame => {
        if (yPosition > 260) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(10);
        pdf.text(`${frame.frame_type} - Floor ${frame.floor}`, 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(8);
        pdf.text(`  Location: ${frame.room || 'Not specified'}`, 25, yPosition);
        yPosition += 6;
        pdf.text(`  Ports: ${frame.port_count} | Capacity: ${frame.capacity}`, 25, yPosition);
        yPosition += 6;
        
        if (frame.rack_position) {
          pdf.text(`  Rack Position: ${frame.rack_position}`, 25, yPosition);
          yPosition += 6;
        }
        yPosition += 5;
      });
    }
    
    // Add footer to all pages
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.text(`Page ${i} of ${pageCount}`, 180, 285);
      pdf.text('Generated by Trade Atlas', 20, 285);
    }
    
    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  };

  const generateExportData = (exportType: string): string => {
    const timestamp = new Date().toISOString();
    const date = new Date().toLocaleDateString();
    
    switch (exportOptions.format) {
      case 'json':
        return JSON.stringify({
          metadata: {
            location: locationName,
            locationId,
            exportType: exportType.replace(/_/g, ' '),
            generatedAt: timestamp,
            exportOptions
          },
          summary: {
            totalCables: cables.length,
            totalFrames: frames.length,
            totalConnections: connections.length,
            totalDocuments: files.length
          },
          cables: exportOptions.includeConnections ? cables.map(cable => ({
            id: cable.id,
            label: cable.cable_label,
            type: cable.cable_type,
            subtype: cable.cable_subtype,
            origin: cable.origin_equipment,
            destination: cable.destination_equipment,
            originFloor: cable.origin_floor,
            destinationFloor: cable.destination_floor,
            capacity: {
              total: cable.capacity_total,
              used: cable.capacity_used,
              spare: cable.capacity_spare
            },
            jacketRating: cable.jacket_rating,
            isMultiSegment: cable.is_multi_segment
          })) : [],
          frames: exportOptions.includeConnections ? frames.map(frame => ({
            id: frame.id,
            type: frame.frame_type,
            floor: frame.floor,
            room: frame.room,
            portCount: frame.port_count,
            capacity: frame.capacity,
            rackPosition: frame.rack_position
          })) : [],
          connections: exportOptions.includeConnections ? connections : [],
          documents: exportOptions.includeImages ? files.map(file => ({
            id: file.id,
            fileName: file.file_name,
            fileType: file.file_type,
            fileSize: file.file_size,
            uploadedBy: file.creator ? `${file.creator.first_name} ${file.creator.last_name}` : 'Unknown',
            uploadedAt: file.created_at
          })) : []
        }, null, 2);
      
      case 'csv':
        return generateCSVData(exportType);
      
      default:
        return generateTextReport(exportType, timestamp, date);
    }
  };

  const generateCSVData = (exportType: string): string => {
    let csvContent = '';
    
    if (exportType === 'port_mapping' || exportType === 'riser_diagram') {
      csvContent = 'Cable Label,Cable Type,Origin Equipment,Destination Equipment,Origin Floor,Destination Floor,Capacity Total,Capacity Used,Jacket Rating\n';
      cables.forEach(cable => {
        csvContent += `"${cable.cable_label}","${cable.cable_type}","${cable.origin_equipment || 'N/A'}","${cable.destination_equipment || 'N/A'}",${cable.origin_floor || 'N/A'},${cable.destination_floor || 'N/A'},${cable.capacity_total || 'N/A'},${cable.capacity_used || 0},"${cable.jacket_rating || 'N/A'}"\n`;
      });
    } else if (exportType === 'capacity_analysis') {
      csvContent = 'Equipment Type,Location,Port Count,Current Capacity,Utilization %\n';
      frames.forEach(frame => {
        const utilization = frame.capacity > 0 ? ((frame.port_count / frame.capacity) * 100).toFixed(1) : '0';
        csvContent += `"${frame.frame_type}","Floor ${frame.floor} - ${frame.room || 'N/A'}",${frame.port_count},${frame.capacity},"${utilization}%"\n`;
      });
    } else {
      // Default cable listing
      csvContent = 'Cable Label,Type,Origin,Destination,Notes\n';
      cables.forEach(cable => {
        csvContent += `"${cable.cable_label}","${cable.cable_type}","${cable.origin_equipment || 'N/A'}","${cable.destination_equipment || 'N/A'}","${cable.notes || 'N/A'}"\n`;
      });
    }
    
    return csvContent;
  };

  const generateTextReport = (exportType: string, timestamp: string, date: string): string => {
    let content = `# ${exportType.replace(/_/g, ' ').toUpperCase()} REPORT\n\n`;
    content += `Location: ${locationName}\n`;
    content += `Generated: ${date}\n`;
    content += `Export Type: ${exportType.replace(/_/g, ' ')}\n`;
    content += `Compliance Standard: ${exportOptions.compliance}\n\n`;
    
    content += `## SUMMARY\n`;
    content += `- Total Cables: ${cables.length}\n`;
    content += `- Total Distribution Frames: ${frames.length}\n`;
    content += `- Total Connections: ${connections.length}\n`;
    content += `- Documentation Files: ${files.length}\n\n`;
    
    if (cables.length > 0) {
      content += `## BACKBONE CABLES\n\n`;
      cables.forEach((cable, index) => {
        content += `${index + 1}. ${cable.cable_label}\n`;
        content += `   Type: ${cable.cable_type.toUpperCase()}${cable.cable_subtype ? ` (${cable.cable_subtype})` : ''}\n`;
        content += `   Route: ${cable.origin_equipment || 'Unknown'} → ${cable.destination_equipment || 'Unknown'}\n`;
        content += `   Floors: ${cable.origin_floor} → ${cable.destination_floor}\n`;
        if (cable.capacity_total) {
          content += `   Capacity: ${cable.capacity_used}/${cable.capacity_total} (${Math.round((cable.capacity_used / cable.capacity_total) * 100)}% utilized)\n`;
        }
        if (cable.jacket_rating) {
          content += `   Jacket: ${cable.jacket_rating}\n`;
        }
        content += `\n`;
      });
    }
    
    if (frames.length > 0) {
      content += `## DISTRIBUTION FRAMES\n\n`;
      frames.forEach((frame, index) => {
        content += `${index + 1}. ${frame.frame_type} - Floor ${frame.floor}\n`;
        content += `   Location: ${frame.room || 'Not specified'}\n`;
        content += `   Ports: ${frame.port_count}\n`;
        content += `   Capacity: ${frame.capacity}\n`;
        if (frame.rack_position) {
          content += `   Rack Position: ${frame.rack_position}\n`;
        }
        content += `\n`;
      });
    }
    
    if (exportType === 'capacity_analysis' && exportOptions.includeCapacityData) {
      content += `## CAPACITY ANALYSIS\n\n`;
      const totalPorts = frames.reduce((sum, frame) => sum + frame.port_count, 0);
      const totalCapacity = frames.reduce((sum, frame) => sum + frame.capacity, 0);
      const overallUtilization = totalCapacity > 0 ? ((totalPorts / totalCapacity) * 100).toFixed(1) : '0';
      
      content += `Overall Utilization: ${overallUtilization}%\n`;
      content += `Total Active Ports: ${totalPorts}\n`;
      content += `Total Available Capacity: ${totalCapacity}\n\n`;
    }
    
    content += `## NOTES\n`;
    content += `This report was generated automatically from the Trade Atlas system.\n`;
    content += `For questions or additional information, please contact your network administrator.\n\n`;
    content += `Report generated on: ${timestamp}\n`;
    
    return content;
  };

  const getContentType = (format: string): string => {
    switch (format) {
      case 'json': return 'application/json';
      case 'csv': return 'text/csv';
      case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default: return 'application/pdf';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Export & Reporting</h3>
          <p className="text-sm text-muted-foreground">
            Generate comprehensive reports and documentation exports
          </p>
        </div>
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogTrigger asChild>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Export Options
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Export Configuration</DialogTitle>
              <DialogDescription>
                Configure export options and compliance standards
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Output Format</label>
                <Select 
                  value={exportOptions.format} 
                  onValueChange={(value: any) => setExportOptions({...exportOptions, format: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    <SelectItem value="csv">CSV Data</SelectItem>
                    <SelectItem value="json">JSON Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Template Style</label>
                <Select 
                  value={exportOptions.template} 
                  onValueChange={(value: any) => setExportOptions({...exportOptions, template: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard Report</SelectItem>
                    <SelectItem value="detailed">Detailed Technical</SelectItem>
                    <SelectItem value="executive">Executive Summary</SelectItem>
                    <SelectItem value="compliance">Compliance Focus</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Compliance Standard</label>
                <Select 
                  value={exportOptions.compliance} 
                  onValueChange={(value: any) => setExportOptions({...exportOptions, compliance: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TIA-568">TIA-568</SelectItem>
                    <SelectItem value="BICSI">BICSI</SelectItem>
                    <SelectItem value="ISO-11801">ISO-11801</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <label className="text-sm font-medium">Include in Export</label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeImages"
                    checked={exportOptions.includeImages}
                    onCheckedChange={(checked: boolean) => 
                      setExportOptions({...exportOptions, includeImages: checked})
                    }
                  />
                  <label htmlFor="includeImages" className="text-sm">Images and Diagrams</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeTestResults"
                    checked={exportOptions.includeTestResults}
                    onCheckedChange={(checked: boolean) => 
                      setExportOptions({...exportOptions, includeTestResults: checked})
                    }
                  />
                  <label htmlFor="includeTestResults" className="text-sm">Test Results</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeConnections"
                    checked={exportOptions.includeConnections}
                    onCheckedChange={(checked: boolean) => 
                      setExportOptions({...exportOptions, includeConnections: checked})
                    }
                  />
                  <label htmlFor="includeConnections" className="text-sm">Connection Details</label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="includeCapacityData"
                    checked={exportOptions.includeCapacityData}
                    onCheckedChange={(checked: boolean) => 
                      setExportOptions({...exportOptions, includeCapacityData: checked})
                    }
                  />
                  <label htmlFor="includeCapacityData" className="text-sm">Capacity Analysis</label>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Export Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exportTypes.map((exportType) => (
          <Card key={exportType.id} className="relative">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                {exportType.icon}
                {exportType.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {exportType.description}
              </p>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {exportType.formats.map(format => (
                  <Badge key={format} variant="outline" className="text-xs">
                    {format.toUpperCase()}
                  </Badge>
                ))}
              </div>

              <Button 
                className="w-full" 
                onClick={() => handleExport(exportType.id)}
                disabled={exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {exporting ? 'Exporting...' : 'Export'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('all_data')} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('summary_report')} disabled={exporting}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Summary Report
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('diagram_images')} disabled={exporting}>
              <Image className="h-4 w-4 mr-2" />
              Export Diagram Images
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('cable_schedule')} disabled={exporting}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Cable Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};