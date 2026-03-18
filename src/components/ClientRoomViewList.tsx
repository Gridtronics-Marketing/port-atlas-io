import { useState, useEffect } from "react";
import { Camera, Search, Maximize2, ImageIcon } from "lucide-react";
import { SignedImage } from "@/components/ui/signed-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { ClientServiceRequestButton } from "@/components/ClientServiceRequestButton";
import { useRoomViewPhotos } from "@/hooks/useRoomViewPhotos";

interface RoomView {
  id: string;
  room_name: string | null;
  description: string | null;
  floor: number;
  ceiling_height: number | null;
  ceiling_height_unit: string | null;
  photo_url: string;
  created_at: string;
}

interface ClientRoomViewListProps {
  locationId: string;
}

export const ClientRoomViewList = ({ locationId }: ClientRoomViewListProps) => {
  const [roomViews, setRoomViews] = useState<RoomView[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedView, setSelectedView] = useState<RoomView | null>(null);
  const { photos, loading: photosLoading } = useRoomViewPhotos(selectedView?.id);

  useEffect(() => {
    const fetchRoomViews = async () => {
      try {
        const { data, error } = await supabase
          .from("room_views")
          .select("id, room_name, description, floor, ceiling_height, ceiling_height_unit, photo_url, created_at")
          .eq("location_id", locationId)
          .order("floor", { ascending: true });

        if (error) throw error;
        setRoomViews(data || []);
      } catch (error) {
        console.error("Error fetching room views:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomViews();
  }, [locationId]);

  const filteredViews = roomViews.filter(rv => {
    const search = searchQuery.toLowerCase();
    return (
      rv.room_name?.toLowerCase().includes(search) ||
      rv.description?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground animate-pulse">
            Loading room views...
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
              <Camera className="h-5 w-5" />
              Room Views
              <Badge variant="secondary">{roomViews.length}</Badge>
            </CardTitle>
            <ClientServiceRequestButton
              locationId={locationId}
              requestType="new_room_view"
              buttonLabel="Request New Room View"
            />
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredViews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No room views found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredViews.map((rv) => (
                <div
                  key={rv.id}
                  className="group relative rounded-lg border bg-card overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                  onClick={() => setSelectedView(rv)}
                >
                  <div className="aspect-video relative overflow-hidden bg-muted">
                    <img
                      src={rv.photo_url}
                      alt={rv.room_name || "Room view"}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Maximize2 className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="font-medium">{rv.room_name || "Unnamed Room"}</p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span>Floor {rv.floor}</span>
                      {rv.ceiling_height && (
                        <span>
                          {rv.ceiling_height} {rv.ceiling_height_unit || "ft"} ceiling
                        </span>
                      )}
                    </div>
                    {rv.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {rv.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog with Tabs */}
      <Dialog open={!!selectedView} onOpenChange={() => setSelectedView(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedView?.room_name || "Room View"}</DialogTitle>
          </DialogHeader>
          {selectedView && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="photos" className="flex items-center gap-1.5">
                  Photos
                  {photos.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      {photos.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4 space-y-4">
                <img
                  src={selectedView.photo_url}
                  alt={selectedView.room_name || "Room view"}
                  className="w-full rounded-lg"
                />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Floor</p>
                    <p className="font-medium">{selectedView.floor}</p>
                  </div>
                  {selectedView.ceiling_height && (
                    <div>
                      <p className="text-muted-foreground">Ceiling Height</p>
                      <p className="font-medium">
                        {selectedView.ceiling_height} {selectedView.ceiling_height_unit || "ft"}
                      </p>
                    </div>
                  )}
                  {selectedView.description && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Description</p>
                      <p className="font-medium">{selectedView.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Added</p>
                    <p className="font-medium">
                      {new Date(selectedView.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="photos" className="mt-4">
                {photosLoading ? (
                  <div className="text-center py-8 text-muted-foreground animate-pulse">
                    Loading photos...
                  </div>
                ) : photos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No additional photos</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="rounded-lg border overflow-hidden bg-card">
                        <img
                          src={photo.photo_url}
                          alt={photo.description || "Room photo"}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="p-2 text-sm">
                          {photo.description && (
                            <p className="font-medium">{photo.description}</p>
                          )}
                          <p className="text-muted-foreground text-xs">
                            {new Date(photo.created_at).toLocaleDateString()}
                            {photo.employee && (
                              <> · {photo.employee.first_name} {photo.employee.last_name}</>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
