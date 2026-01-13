import { useState, useEffect } from "react";
import { Network, Search, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { ClientDropPointDetail } from "@/components/ClientDropPointDetail";

interface DropPoint {
  id: string;
  label: string | null;
  point_type: string | null;
  status: string | null;
  floor: number | null;
  room: string | null;
  notes: string | null;
  installed_date: string | null;
  tested_date: string | null;
  test_results: any;
}

interface ClientDropPointListProps {
  locationId: string;
}

export const ClientDropPointList = ({ locationId }: ClientDropPointListProps) => {
  const [dropPoints, setDropPoints] = useState<DropPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDropPoint, setSelectedDropPoint] = useState<DropPoint | null>(null);

  useEffect(() => {
    const fetchDropPoints = async () => {
      try {
        const { data, error } = await supabase
          .from("drop_points")
          .select("id, label, point_type, status, floor, room, notes, installed_date, tested_date, test_results")
          .eq("location_id", locationId)
          .order("label");

        if (error) throw error;
        setDropPoints(data || []);
      } catch (error) {
        console.error("Error fetching drop points:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDropPoints();
  }, [locationId]);

  const filteredDropPoints = dropPoints.filter(dp => {
    const search = searchQuery.toLowerCase();
    return (
      dp.label?.toLowerCase().includes(search) ||
      dp.point_type?.toLowerCase().includes(search) ||
      dp.room?.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "Active":
      case "Installed":
        return (
          <Badge className="bg-green-500/10 text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
      case "Pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "Issue":
        return (
          <Badge className="bg-red-500/10 text-red-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            Issue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground animate-pulse">
            Loading drop points...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Drop Points
              <Badge variant="secondary">{dropPoints.length}</Badge>
            </CardTitle>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by label, type, or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredDropPoints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No drop points found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDropPoints.map((dp) => (
                <div
                  key={dp.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedDropPoint(dp)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{dp.label || "Unlabeled"}</p>
                      <Badge variant="outline" className="text-xs">
                        {dp.point_type || "Unknown"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {dp.floor !== null && <span>Floor {dp.floor}</span>}
                      {dp.room && <span>{dp.room}</span>}
                      {dp.tested_date && (
                        <span className="text-green-600">
                          Tested: {new Date(dp.tested_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>{getStatusBadge(dp.status)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ClientDropPointDetail
        dropPoint={selectedDropPoint}
        open={!!selectedDropPoint}
        onClose={() => setSelectedDropPoint(null)}
      />
    </>
  );
};
