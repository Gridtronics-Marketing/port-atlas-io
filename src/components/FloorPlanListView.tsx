import { useState } from 'react';
import { Map, Plus, Eye, Pencil, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SignedImage } from '@/components/ui/signed-image';
import { EditFloorPlanDialog } from './EditFloorPlanDialog';
import { AddFloorPlanDialog } from './AddFloorPlanDialog';
import { getFloorPlanMetadata, getFloorPlanImagePath } from '@/lib/storage-utils';

interface FloorPlanListViewProps {
  locationId: string;
  locationName: string;
  floors: number;
  floorPlanFiles: Record<string, any> | null;
  onFloorPlanChanged: () => void;
}

interface FloorEntry {
  key: string;
  name: string;
  imagePath: string | null;
  type: 'floor' | 'outbuilding';
}

export const FloorPlanListView = ({
  locationId,
  locationName,
  floors,
  floorPlanFiles,
  onFloorPlanChanged,
}: FloorPlanListViewProps) => {
  const [editingFloor, setEditingFloor] = useState<FloorEntry | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Build list of all floors + outbuildings
  const entries: FloorEntry[] = [];

  // Regular floors
  for (let i = 1; i <= (floors || 1); i++) {
    const key = i.toString();
    const metadata = floorPlanFiles ? getFloorPlanMetadata(floorPlanFiles, key) : null;
    const imagePath = floorPlanFiles ? getFloorPlanImagePath(floorPlanFiles, key) : null;
    entries.push({
      key,
      name: metadata?.name || `Floor ${i}`,
      imagePath,
      type: 'floor',
    });
  }

  // Outbuildings
  if (floorPlanFiles) {
    Object.entries(floorPlanFiles).forEach(([key, value]) => {
      if (key.startsWith('outbuilding_')) {
        let name = key.replace('outbuilding_', 'Outbuilding ');
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const obj = value as Record<string, unknown>;
          if (typeof obj.name === 'string' && obj.name) name = obj.name;
        }
        const imagePath = getFloorPlanImagePath(floorPlanFiles, key);
        entries.push({ key, name, imagePath, type: 'outbuilding' });
      }
    });
  }

  const handleOpen = (entry: FloorEntry) => {
    const floorNum = entry.key.startsWith('outbuilding_') ? 0 : parseInt(entry.key) || 1;
    window.open(
      `/floor-plan-editor?locationId=${locationId}&floor=${floorNum}&mode=floor`,
      '_blank'
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Floor Plans ({entries.length})
        </h3>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Floorplan
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Map className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">No floor plans yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add your first floor plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Card key={entry.key} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-3">
                {/* Thumbnail */}
                <div className="w-20 h-14 rounded-md overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center border">
                  {entry.imagePath ? (
                    <SignedImage
                      bucket="floor-plans"
                      path={entry.imagePath}
                      alt={entry.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image className="h-6 w-6 text-muted-foreground/40" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{entry.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant={entry.imagePath ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                      {entry.imagePath ? 'Has Map' : 'Empty'}
                    </Badge>
                    {entry.type === 'outbuilding' && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Outbuilding
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleOpen(entry)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setEditingFloor(entry)}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingFloor && (
        <EditFloorPlanDialog
          open={!!editingFloor}
          onOpenChange={(open) => { if (!open) setEditingFloor(null); }}
          locationId={locationId}
          floorKey={editingFloor.key}
          floorName={editingFloor.name}
          imagePath={editingFloor.imagePath}
          floorPlanFiles={floorPlanFiles}
          onSaved={onFloorPlanChanged}
        />
      )}

      {/* Add Dialog */}
      <AddFloorPlanDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        locationId={locationId}
        locationName={locationName}
        currentFloors={floors}
        floorPlanFiles={floorPlanFiles}
        onSaved={onFloorPlanChanged}
      />
    </div>
  );
};
