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
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create mock file content based on export type
      const exportData = generateExportData(exportType);
      
      // Create and download file
      const blob = new Blob([exportData], { 
        type: getContentType(exportOptions.format) 
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${locationName}-${exportType}-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${exportType.replace('_', ' ')} exported successfully as ${exportOptions.format.toUpperCase()}`
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
      setShowExportDialog(false);
    }
  };

  const generateExportData = (exportType: string): string => {
    const baseData = {
      location: locationName,
      locationId,
      generatedAt: new Date().toISOString(),
      exportType,
      options: exportOptions,
      cables: cables.length,
      frames: frames.length,
      connections: connections.length,
      documents: files.length
    };

    switch (exportOptions.format) {
      case 'json':
        return JSON.stringify({
          ...baseData,
          cables: exportOptions.includeConnections ? cables : [],
          frames: exportOptions.includeConnections ? frames : [],
          connections: exportOptions.includeConnections ? connections : [],
          files: exportOptions.includeImages ? files : []
        }, null, 2);
      
      case 'csv':
        return generateCSVData(exportType, baseData);
      
      case 'excel':
        return generateExcelData(exportType, baseData);
      
      default:
        return generatePDFData(exportType, baseData);
    }
  };

  const generateCSVData = (exportType: string, baseData: any): string => {
    let csvContent = `Export Type,${exportType}\n`;
    csvContent += `Location,${baseData.location}\n`;
    csvContent += `Generated At,${baseData.generatedAt}\n\n`;
    
    if (exportType === 'port_mapping' && exportOptions.includeConnections) {
      csvContent += 'From Port,To Port,Connection Type,Status\n';
      connections.forEach(conn => {
        csvContent += `${conn.from_port},${conn.to_port},${conn.cable_type || 'copper'},${conn.connection_status}\n`;
      });
    }
    
    return csvContent;
  };

  const generateExcelData = (exportType: string, baseData: any): string => {
    // Placeholder for Excel data generation
    return `Excel export data for ${exportType} would be generated here`;
  };

  const generatePDFData = (exportType: string, baseData: any): string => {
    // Placeholder for PDF data generation
    return `PDF export data for ${exportType} would be generated here`;
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
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Generate Summary Report
            </Button>
            <Button variant="outline" size="sm">
              <Image className="h-4 w-4 mr-2" />
              Export Diagram Images
            </Button>
            <Button variant="outline" size="sm">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Cable Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};