import { useState, useEffect } from "react";
import { Package, Search, Server, Wifi, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Equipment {
  id: string;
  name: string;
  equipment_type: string;
  make: string | null;
  model: string | null;
  serial_number: string | null;
  status: string | null;
  rack_position: number | null;
  notes: string | null;
}

interface ClientEquipmentListProps {
  locationId: string;
}

export const ClientEquipmentList = ({ locationId }: ClientEquipmentListProps) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const { data, error } = await supabase
          .from("equipment")
          .select("id, name, equipment_type, make, model, serial_number, status, rack_position, notes")
          .eq("location_id", locationId)
          .order("name");

        if (error) throw error;
        setEquipment(data || []);
      } catch (error) {
        console.error("Error fetching equipment:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, [locationId]);

  const filteredEquipment = equipment.filter(eq => {
    const search = searchQuery.toLowerCase();
    return (
      eq.name.toLowerCase().includes(search) ||
      eq.equipment_type.toLowerCase().includes(search) ||
      eq.make?.toLowerCase().includes(search) ||
      eq.model?.toLowerCase().includes(search)
    );
  });

  const getEquipmentIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("switch") || lowerType.includes("router")) {
      return <Wifi className="h-5 w-5 text-blue-500" />;
    }
    if (lowerType.includes("server")) {
      return <Server className="h-5 w-5 text-purple-500" />;
    }
    if (lowerType.includes("monitor") || lowerType.includes("display")) {
      return <Monitor className="h-5 w-5 text-green-500" />;
    }
    return <Package className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "operational":
        return <Badge className="bg-green-500/10 text-green-600">Active</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-500/10 text-yellow-600">Maintenance</Badge>;
      case "offline":
      case "inactive":
        return <Badge variant="secondary">Offline</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground animate-pulse">
            Loading equipment...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Equipment
            <Badge variant="secondary">{equipment.length}</Badge>
          </CardTitle>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, type, make, or model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredEquipment.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No equipment found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEquipment.map((eq) => (
              <div
                key={eq.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-muted">
                    {getEquipmentIcon(eq.equipment_type)}
                  </div>
                  <div>
                    <p className="font-medium">{eq.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{eq.equipment_type}</span>
                      {eq.make && eq.model && (
                        <>
                          <span>•</span>
                          <span>{eq.make} {eq.model}</span>
                        </>
                      )}
                    </div>
                    {eq.serial_number && (
                      <p className="text-xs text-muted-foreground">
                        S/N: {eq.serial_number}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {eq.rack_position !== null && (
                    <Badge variant="outline" className="text-xs">
                      Rack U{eq.rack_position}
                    </Badge>
                  )}
                  {getStatusBadge(eq.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
