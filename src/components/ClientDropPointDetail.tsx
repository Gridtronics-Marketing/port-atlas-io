import { useState, useEffect } from "react";
import { Network, CheckCircle, Calendar, MapPin, Image } from "lucide-react";
import { SignedImage } from "@/components/ui/signed-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

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

interface TestResult {
  id: string;
  test_type: string;
  pass_fail: string;
  test_date: string;
  notes: string | null;
}

interface Photo {
  id: string;
  photo_url: string;
  description: string | null;
  photo_type: string | null;
  storage_bucket: string | null;
  created_at: string;
}

interface ClientDropPointDetailProps {
  dropPoint: DropPoint | null;
  open: boolean;
  onClose: () => void;
}

export const ClientDropPointDetail = ({ dropPoint, open, onClose }: ClientDropPointDetailProps) => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (dropPoint && open) {
      fetchDetails();
    }
  }, [dropPoint?.id, open]);

  const fetchDetails = async () => {
    if (!dropPoint) return;
    
    setLoading(true);
    try {
      // Fetch test results from test_results table
      const { data: testData } = await supabase
        .from("test_results")
        .select("id, test_type, pass_fail, test_date, notes")
        .eq("drop_point_id", dropPoint.id)
        .order("test_date", { ascending: false });

      setTestResults((testData || []) as TestResult[]);

      // Fetch photos
      const { data: photoData } = await supabase
        .from("drop_point_photos")
        .select("id, photo_url, description, photo_type, storage_bucket, created_at")
        .eq("drop_point_id", dropPoint.id)
        .order("created_at", { ascending: false });

      setPhotos((photoData || []) as Photo[]);
    } catch (error) {
      console.error("Error fetching drop point details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!dropPoint) return null;

  const getResultBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pass":
      case "passed":
        return <Badge className="bg-green-500/10 text-green-600">Pass</Badge>;
      case "fail":
      case "failed":
        return <Badge variant="destructive">Fail</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            {dropPoint.label || "Drop Point Details"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="font-medium">{dropPoint.point_type || "Unknown"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={dropPoint.status === "Active" ? "default" : "secondary"}>
                {dropPoint.status || "Unknown"}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Floor {dropPoint.floor || "N/A"}, {dropPoint.room || "N/A"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Installed</p>
              <p className="font-medium flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {dropPoint.installed_date
                  ? new Date(dropPoint.installed_date).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          {dropPoint.notes && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-sm bg-muted/50 p-3 rounded-lg">{dropPoint.notes}</p>
            </div>
          )}

          <Tabs defaultValue="tests" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="tests" className="flex-1">
                Test Results ({testResults.length})
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex-1">
                Photos ({photos.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tests" className="mt-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : testResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No test results recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {testResults.map((test) => (
                    <Card key={test.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{test.test_type}</span>
                          {getResultBadge(test.pass_fail)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(test.test_date).toLocaleDateString()}
                        </p>
                        {test.notes && (
                          <p className="text-sm mt-2 text-muted-foreground">{test.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="photos" className="mt-4">
              {loading ? (
                <div className="text-center py-4 text-muted-foreground">Loading...</div>
              ) : photos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Image className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No photos available</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="space-y-2">
                      <SignedImage
                        bucket={photo.storage_bucket || "floor-plans"}
                        path={photo.photo_url}
                        alt={photo.description || "Drop point photo"}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {photo.description && (
                        <p className="text-xs text-muted-foreground">{photo.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
