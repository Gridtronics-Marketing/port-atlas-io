import { useState, useEffect } from "react";
import { Search, Filter, Cable, Shield, Wifi, Zap, Eye, Edit, Trash2, MoreHorizontal, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { DropPointDetailsModal } from "./DropPointDetailsModal";
import { ErrorBoundary } from "./ErrorBoundary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SwipeableRow } from "@/components/ui/swipeable-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDropPoints } from "@/hooks/useDropPoints";
import { useIsMobile } from "@/hooks/use-mobile";

interface DropPointListProps {
  locationId: string;
}

const DropPointListContent = ({ locationId }: DropPointListProps) => {
  const { dropPoints, loading, error, fetchDropPoints, deleteDropPoint } = useDropPoints(locationId);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedDropPoint, setSelectedDropPoint] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Emit telemetry when tab opens
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('droppoint_tab_open', {
      detail: { locationId, timestamp: Date.now() }
    }));
  }, [locationId]);

  // Safe filtering with defensive checks
  const filteredDropPoints = (dropPoints || []).filter((point) => {
    if (!point) return false;
    
    const label = point.label || 'TBD';
    const room = point.room || '';
    
    const matchesSearch = label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || point.point_type === filterType;
    const matchesStatus = filterStatus === "all" || point.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planned":
        return "bg-red-500/20 text-red-700 border-red-500/40";
      case "roughed_in":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/40";
      case "finished":
        return "bg-green-500/20 text-green-700 border-green-500/40";
      case "tested":
        return "bg-green-500/20 text-green-700 border-green-500/40";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "data": return Cable;
      case "fiber": return Cable;
      case "security": return Shield;
      case "wireless": return Wifi;
      case "power": return Zap;
      default: return Cable;
    }
  };

  // Skeleton loader while loading
  if (loading) {
    return (
      <div className="space-y-4" data-testid="skeleton-droppoints">
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[140px]" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
        <Card className="shadow-soft">
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <Card className="border-destructive/50" data-testid="error-droppoints">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Unable to load Drop Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error || "An error occurred while loading drop points. Please try again."}
          </p>
          <Button onClick={fetchDropPoints} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!dropPoints || dropPoints.length === 0) {
    return (
      <Card className="shadow-soft">
        <CardContent className="py-8 text-center">
          <Cable className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No drop points found for this location.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add drop points using the floor plan or interactive map.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="list-droppoints">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drop points..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-popover border">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="data">Data</SelectItem>
            <SelectItem value="fiber">Fiber</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="wireless">Wireless</SelectItem>
            <SelectItem value="power">Power</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover border">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="roughed_in">Roughed In</SelectItem>
            <SelectItem value="finished">Finished</SelectItem>
            <SelectItem value="tested">Tested</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Drop Points Table */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cable className="h-5 w-5 text-primary" />
            Drop Points
            <Badge variant="secondary">{filteredDropPoints.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cable ID</TableHead>
                  <TableHead>Patch Panel</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDropPoints.map((point) => {
                  const rowContent = (
                    <TableRow 
                      key={point.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedDropPoint(point);
                        setDetailsModalOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">{point.label}</TableCell>
                      <TableCell>{point.room || "—"}</TableCell>
                      <TableCell>{point.floor || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const IconComponent = getTypeIcon(point.point_type);
                            return <IconComponent className="h-4 w-4" />;
                          })()}
                          <span className="capitalize">{point.point_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(point.status)}>
                          {point.status === 'tested' && <span className="mr-1">✓</span>}
                          {point.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {point.cable_id || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {point.patch_panel_port || "—"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover border">
                            <DropdownMenuItem onClick={() => {
                              setSelectedDropPoint(point);
                              setDetailsModalOpen(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedDropPoint(point);
                              setDetailsModalOpen(true);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Drop Point
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteDropPoint(point.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Drop Point
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );

                  if (isMobile) {
                    return (
                      <SwipeableRow 
                        key={point.id} 
                        onDelete={() => deleteDropPoint(point.id)}
                      >
                        {rowContent}
                      </SwipeableRow>
                    );
                  }

                  return rowContent;
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DropPointDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        dropPoint={selectedDropPoint}
        locationId={locationId}
      />
    </div>
  );
};

export const DropPointList = ({ locationId }: DropPointListProps) => {
  return (
    <ErrorBoundary onReset={() => window.location.reload()}>
      <DropPointListContent locationId={locationId} />
    </ErrorBoundary>
  );
};