import { useState } from "react";
import { Search, Filter, Cable, Shield, Wifi, Zap, Eye, Edit, Trash2, MoreHorizontal, Loader2 } from "lucide-react";
import { DropPointDetailsModal } from "./DropPointDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface DropPointListProps {
  locationId: string;
}

export const DropPointList = ({ locationId }: DropPointListProps) => {
  const { dropPoints, loading, deleteDropPoint } = useDropPoints(locationId);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedDropPoint, setSelectedDropPoint] = useState<any>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const filteredDropPoints = dropPoints.filter((point) => {
    const matchesSearch = point.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (point.room?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesType = filterType === "all" || point.point_type === filterType;
    const matchesStatus = filterStatus === "all" || point.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success text-success-foreground";
      case "tested":
        return "bg-primary text-primary-foreground";
      case "installed":
        return "bg-warning text-warning-foreground";
      case "planned":
        return "bg-muted text-muted-foreground";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading drop points...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
            <SelectItem value="installed">Installed</SelectItem>
            <SelectItem value="tested">Tested</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
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
                {filteredDropPoints.map((point) => (
                  <TableRow key={point.id}>
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
                        {point.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {point.cable_id || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {point.patch_panel_port || "—"}
                    </TableCell>
                    <TableCell>
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
                ))}
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