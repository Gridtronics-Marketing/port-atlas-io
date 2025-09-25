import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Upload, Download, Eye, Edit, Trash2, Search, Filter, BookOpen, Shield } from 'lucide-react';
import { useDocumentationFiles } from '@/hooks/useDocumentationFiles';
import { useSystemConfigurations } from '@/hooks/useSystemConfigurations';

interface DocumentationTabProps {
  locationId: string;
}

export const DocumentationTab: React.FC<DocumentationTabProps> = ({ locationId }) => {
  const { files, loading, addFile, deleteFile } = useDocumentationFiles(locationId);
  const { configurations } = useSystemConfigurations('compliance_standards');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const defaultStandard = configurations.find(c => c.key === 'default_standard')?.value || 'TIA-568';
  const requireApproval = configurations.find(c => c.key === 'require_documentation_approval')?.value === 'true';
  const auditTrailEnabled = configurations.find(c => c.key === 'enable_audit_trail')?.value === 'true';

  const getFileTypeIcon = (fileType: string) => {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (type.includes('image')) return <Eye className="h-4 w-4 text-blue-500" />;
    if (type.includes('excel') || type.includes('spreadsheet')) return <FileText className="h-4 w-4 text-green-500" />;
    return <FileText className="h-4 w-4" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'as_built': return 'bg-blue-100 text-blue-800';
      case 'test_results': return 'bg-green-100 text-green-800';
      case 'compliance': return 'bg-purple-100 text-purple-800';
      case 'specifications': return 'bg-orange-100 text-orange-800';
      case 'certificates': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchTerm || 
      file.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      file.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || file.document_category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const documentCategories = ['as_built', 'test_report', 'compliance', 'specification', 'warranty', 'manual'];

  if (loading) {
    return <div className="text-center">Loading documentation...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Documentation & Compliance</h3>
          <p className="text-sm text-muted-foreground">
            Manage standards compliance documentation and file repository
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline">
              <BookOpen className="h-3 w-3 mr-1" />
              Standard: {defaultStandard}
            </Badge>
            {auditTrailEnabled && (
              <Badge variant="outline">
                <Shield className="h-3 w-3 mr-1" />
                Audit Trail Enabled
              </Badge>
            )}
            {requireApproval && (
              <Badge variant="outline" className="text-yellow-600">
                Approval Required
              </Badge>
            )}
          </div>
        </div>
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Documentation</DialogTitle>
              <DialogDescription>
                Upload compliance documents, test results, or as-built drawings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop files here, or click to browse
                </p>
                <Input type="file" className="mt-4" multiple />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Cancel
                </Button>
                <Button>Upload Files</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {documentCategories.map(category => (
              <SelectItem key={category} value={category}>
                {category.replace('_', ' ').toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document Grid */}
      <div className="grid gap-4">
        {filteredFiles.map((file) => (
          <Card key={file.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getFileTypeIcon(file.file_type)}
                  <div className="flex-1">
                    <div className="font-medium">{file.file_name}</div>
                    {file.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {file.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {file.document_category && (
                        <Badge className={getCategoryColor(file.document_category)}>
                          {file.document_category.replace('_', ' ').toUpperCase()}
                        </Badge>
                      )}
                      {file.version && (
                        <Badge variant="outline">v{file.version}</Badge>
                      )}
                      {file.standards_reference && (
                        <Badge variant="outline">{file.standards_reference}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.file_size || 0)}</span>
                      <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      {file.tags && file.tags.length > 0 && (
                        <span>Tags: {file.tags.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => deleteFile(file.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredFiles.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {files.length === 0 
                  ? "No documentation files uploaded yet."
                  : "No documents match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{files.length}</div>
            <div className="text-sm text-muted-foreground">Total Documents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {files.filter(f => f.document_category === 'as_built').length}
            </div>
            <div className="text-sm text-muted-foreground">As-Built Drawings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {files.filter(f => f.document_category === 'test_report').length}
            </div>
            <div className="text-sm text-muted-foreground">Test Results</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {files.filter(f => f.document_category === 'compliance').length}
            </div>
            <div className="text-sm text-muted-foreground">Compliance Docs</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};