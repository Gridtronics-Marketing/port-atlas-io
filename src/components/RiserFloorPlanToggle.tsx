import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Network, ToggleLeft, ToggleRight, Map } from 'lucide-react';
import { InteractiveFloorPlan } from '@/components/InteractiveFloorPlan';
import { InteractiveRiserDiagram } from '@/components/InteractiveRiserDiagram';

interface RiserFloorPlanToggleProps {
  locationId: string;
  locationName: string;
  floorPlanUrls?: Record<string, string>;
  onAddEquipment?: () => void;
  onAddCable?: () => void;
}

export const RiserFloorPlanToggle: React.FC<RiserFloorPlanToggleProps> = ({
  locationId,
  locationName,
  floorPlanUrls = {},
  onAddEquipment,
  onAddCable
}) => {
  const [viewMode, setViewMode] = useState<'horizontal' | 'vertical'>('vertical');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);

  const floors = Object.keys(floorPlanUrls)
    .filter(key => key.startsWith('floor_'))
    .map(key => parseInt(key.replace('floor_', '')))
    .sort((a, b) => a - b);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'horizontal' ? 'vertical' : 'horizontal');
  };

  return (
    <div className="space-y-4">
      {/* View Toggle Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant={viewMode === 'vertical' ? 'default' : 'outline'}
            size="sm"
            onClick={toggleViewMode}
            className="gap-2"
          >
            {viewMode === 'vertical' ? <Network className="h-4 w-4" /> : <Building className="h-4 w-4" />}
            {viewMode === 'vertical' ? 'Riser View' : 'Floor Plan View'}
            {viewMode === 'vertical' ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
          </Button>
          
          {viewMode === 'horizontal' && floors.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Floor:</span>
              {floors.map(floor => (
                <Button
                  key={floor}
                  size="sm"
                  variant={selectedFloor === floor ? 'default' : 'outline'}
                  onClick={() => setSelectedFloor(floor)}
                >
                  {floor}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={viewMode === 'vertical' ? 'default' : 'outline'}>
            {viewMode === 'vertical' ? 'Vertical Infrastructure' : 'Horizontal Layout'}
          </Badge>
        </div>
      </div>

      {/* Main Content Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {viewMode === 'vertical' ? (
              <>
                <Network className="h-5 w-5" />
                Riser Diagram - {locationName}
              </>
            ) : (
              <>
                <Map className="h-5 w-5" />
                Floor Plan - {locationName} (Floor {selectedFloor})
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {viewMode === 'vertical' ? (
            <InteractiveRiserDiagram
              locationId={locationId}
              locationName={locationName}
              onAddEquipment={onAddEquipment}
              onAddCable={onAddCable}
            />
          ) : (
            <div className="space-y-4">
              {floorPlanUrls[`floor_${selectedFloor}`] ? (
                <div className="border rounded-lg bg-background overflow-auto">
                  <img 
                    src={floorPlanUrls[`floor_${selectedFloor}`]}
                    alt={`Floor ${selectedFloor} Plan`}
                    className="w-full h-auto"
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-8 bg-muted/50 min-h-[400px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Building className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Floor Plan Available</h3>
                    <p>Upload a floor plan for Floor {selectedFloor} to view equipment locations.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Panel */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Active View</div>
                <div className="font-medium capitalize">{viewMode} Infrastructure</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Available Floors</div>
                <div className="font-medium">{floors.length} Floor Plans</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Integration</div>
                <div className="font-medium">Cross-Referenced</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};