import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, Trash2, FileImage, Building, Network } from "lucide-react";
import { CreateRiserDiagramModal } from "./CreateRiserDiagramModal";
import { RiserDiagramViewer } from "./RiserDiagramViewer";

interface RiserDiagram {
  id: string;
  name: string;
  description?: string;
  filePath: string;
  fileType: 'image' | 'pdf';
  createdAt: string;
  updatedAt: string;
}

interface RiserDiagramLibraryProps {
  locationId: string;
  locationName: string;
}

export const RiserDiagramLibrary = ({
  locationId,
  locationName
}: RiserDiagramLibraryProps) => {
  const [riserDiagrams, setRiserDiagrams] = useState<RiserDiagram[]>([
    // Mock data - in real implementation, this would come from API
    {
      id: '1',
      name: 'Main Building Riser',
      description: 'Primary vertical pathways for the main building',
      filePath: `${locationId}/risers/main_riser.png`,
      fileType: 'image',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20'
    },
    {
      id: '2', 
      name: 'East Wing Distribution',
      description: 'Secondary distribution for east wing floors 3-8',
      filePath: `${locationId}/risers/east_wing.pdf`,
      fileType: 'pdf',
      createdAt: '2024-01-18',
      updatedAt: '2024-01-18'
    }
  ]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRiser, setSelectedRiser] = useState<RiserDiagram | null>(null);
  const [showViewer, setShowViewer] = useState(false);

  const handleViewRiser = (riser: RiserDiagram) => {
    setSelectedRiser(riser);
    setShowViewer(true);
  };

  const handleEditRiser = (riser: RiserDiagram) => {
    if (riser.fileType === 'image') {
      // Open in drawing editor for images
      const editorUrl = `/floor-plan-editor?mode=riser&location=${locationId}&riser=${riser.id}&name=${encodeURIComponent(riser.name)}`;
      window.open(editorUrl, '_blank', 'width=1200,height=800');
    } else {
      // For PDFs, suggest uploading a new version
      handleViewRiser(riser);
    }
  };

  const handleDeleteRiser = async (riserId: string) => {
    // TODO: Implement delete functionality
    setRiserDiagrams(prev => prev.filter(r => r.id !== riserId));
  };

  const handleRiserCreated = () => {
    // TODO: Refresh riser diagrams list
    console.log('Riser created, refreshing list...');
  };

  const getFileTypeIcon = (fileType: string) => {
    return fileType === 'pdf' ? FileImage : Building;
  };

  const getFileTypeBadge = (fileType: string) => {
    return fileType === 'pdf' ? (
      <Badge variant="secondary">PDF</Badge>
    ) : (
      <Badge variant="outline">Drawing</Badge>
    );
  };

  if (showViewer && selectedRiser) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{selectedRiser.name}</h3>
            {selectedRiser.description && (
              <p className="text-sm text-muted-foreground">{selectedRiser.description}</p>
            )}
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowViewer(false)}
          >
            Back to Library
          </Button>
        </div>
        <RiserDiagramViewer 
          locationId={locationId}
          locationName={locationName}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Riser Diagrams
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage vertical pathway diagrams for {locationName}
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Riser Diagram
        </Button>
      </div>

      {/* Riser Diagrams Grid */}
      {riserDiagrams.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No Riser Diagrams Yet</h4>
            <p className="text-muted-foreground mb-4">
              Create your first riser diagram by uploading an existing design or using our drawing tools.
            </p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Diagram
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {riserDiagrams.map((riser) => {
            const FileTypeIcon = getFileTypeIcon(riser.fileType);
            
            return (
              <Card key={riser.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileTypeIcon className="h-5 w-5 text-primary" />
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base truncate">{riser.name}</CardTitle>
                        {riser.description && (
                          <CardDescription className="line-clamp-2">
                            {riser.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    {getFileTypeBadge(riser.fileType)}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>Created: {new Date(riser.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(riser.updatedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleViewRiser(riser)}
                      className="flex-1"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleEditRiser(riser)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteRiser(riser.id)}
                      className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      <CreateRiserDiagramModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        locationId={locationId}
        locationName={locationName}
        onRiserCreated={handleRiserCreated}
      />
    </div>
  );
};