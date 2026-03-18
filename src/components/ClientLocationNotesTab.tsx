import { useState, useEffect } from "react";
import { FileText, Download, StickyNote } from "lucide-react";
import { getSignedStorageUrl } from "@/lib/storage-utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWalkThroughNotes } from "@/hooks/useWalkThroughNotes";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ClientLocationNotesTabProps {
  locationId: string;
  totalFloors: number;
}

interface DocFile {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  created_at: string | null;
}

export const ClientLocationNotesTab = ({ locationId, totalFloors }: ClientLocationNotesTabProps) => {
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  const [docFiles, setDocFiles] = useState<DocFile[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);

  const floorToFetch = selectedFloor === "all" ? undefined : parseInt(selectedFloor);
  const { notes, loading: notesLoading } = useWalkThroughNotes(locationId, floorToFetch);

  const floorOptions = Array.from({ length: totalFloors }, (_, i) => i + 1);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const { data, error } = await supabase
          .from("documentation_files")
          .select("id, file_name, file_path, file_type, created_at")
          .eq("location_id", locationId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setDocFiles(data || []);
      } catch (error) {
        console.error("Error fetching docs:", error);
      } finally {
        setDocsLoading(false);
      }
    };
    fetchDocs();
  }, [locationId]);

  const getFileUrl = (filePath: string) => {
    return `https://mhrekppksiekhstnteyu.supabase.co/storage/v1/object/public/floor-plans/${filePath}`;
  };

  return (
    <div className="space-y-6">
      {/* Walk-Through Notes (read-only) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5 text-primary" />
                Walk-Through Notes
              </CardTitle>
              <CardDescription>Notes captured during site walk-throughs</CardDescription>
            </div>
            <Select value={selectedFloor} onValueChange={setSelectedFloor}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                {floorOptions.map((floor) => (
                  <SelectItem key={floor} value={floor.toString()}>Floor {floor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-[300px]">
            {notesLoading ? (
              <div className="text-sm text-muted-foreground text-center py-4">Loading notes...</div>
            ) : notes.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">No walk-through notes yet.</div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div key={note.id} className="p-3 bg-muted rounded-lg space-y-1">
                    <Badge variant="outline" className="text-xs">Floor {note.floor}</Badge>
                    <p className="text-sm text-foreground">{note.note_text}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Documentation Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Documentation
          </CardTitle>
          <CardDescription>Site documentation and files</CardDescription>
        </CardHeader>
        <CardContent>
          {docsLoading ? (
            <div className="text-sm text-muted-foreground text-center py-4">Loading documents...</div>
          ) : docFiles.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">No documentation available.</div>
          ) : (
            <div className="space-y-2">
              {docFiles.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.file_type || "Document"} {doc.created_at && `• ${format(new Date(doc.created_at), "MMM d, yyyy")}`}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={getFileUrl(doc.file_path)} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
