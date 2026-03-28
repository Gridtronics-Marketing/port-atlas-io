import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Mail, StickyNote, Plus, Loader2, Paperclip } from "lucide-react";
import { useClientCommunications } from "@/hooks/useClientCommunications";
import { formatDistanceToNow } from "date-fns";

interface ClientCommunicationLogProps {
  clientId: string | undefined;
  onSendEmail: () => void;
}

export const ClientCommunicationLog = ({ clientId, onSendEmail }: ClientCommunicationLogProps) => {
  const { communications, loading, addNote } = useClientCommunications(clientId);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    await addNote(noteText.trim());
    setNoteText("");
    setShowNoteInput(false);
    setSavingNote(false);
  };

  return (
    <Card className="shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recent Communication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="text-xs h-7 flex-1" onClick={onSendEmail}>
            <Mail className="h-3 w-3 mr-1" /> Send Message
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-7 flex-1" onClick={() => setShowNoteInput(!showNoteInput)}>
            <StickyNote className="h-3 w-3 mr-1" /> Log Note
          </Button>
        </div>

        {showNoteInput && (
          <div className="space-y-2">
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Internal note..."
              rows={3}
              className="text-sm"
            />
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowNoteInput(false); setNoteText(""); }}>Cancel</Button>
              <Button size="sm" className="h-7 text-xs" onClick={handleSaveNote} disabled={savingNote || !noteText.trim()}>
                {savingNote ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Save
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : communications.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No communication history yet</p>
        ) : (
          <div className="space-y-2">
            {communications.map((comm) => (
              <div key={comm.id} className="flex items-start gap-2 text-xs border-b border-border pb-2 last:border-0">
                <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${comm.type === 'email' ? 'bg-success' : 'bg-warning'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {comm.type === 'email' ? 'Email' : 'Note'}
                    </Badge>
                    {comm.status && comm.type === 'email' && (
                      <span className={`text-[10px] ${comm.status === 'sent' ? 'text-success' : comm.status === 'failed' ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {comm.status === 'sent' ? '✔ Sent' : comm.status === 'failed' ? '✖ Failed' : comm.status}
                      </span>
                    )}
                  </div>
                  {comm.type === 'email' && comm.to_email && (
                    <p className="text-muted-foreground truncate">To: {comm.to_email}</p>
                  )}
                  {comm.subject && <p className="font-medium text-foreground truncate">{comm.subject}</p>}
                  {comm.type === 'note' && comm.body && (
                    <p className="text-muted-foreground italic truncate">"{comm.body}"</p>
                  )}
                  <p className="text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(comm.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
