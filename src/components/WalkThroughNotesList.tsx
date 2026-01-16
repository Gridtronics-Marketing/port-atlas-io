import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useWalkThroughNotes } from '@/hooks/useWalkThroughNotes';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface WalkThroughNotesListProps {
  locationId: string;
  totalFloors: number;
}

export const WalkThroughNotesList = ({ locationId, totalFloors }: WalkThroughNotesListProps) => {
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteFloor, setNewNoteFloor] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Fetch notes - pass undefined for "all floors" view, or specific floor number
  const floorToFetch = selectedFloor === 'all' ? undefined : parseInt(selectedFloor);
  const { notes, loading, addNote, deleteNote } = useWalkThroughNotes(locationId, floorToFetch);

  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    error: speechError,
  } = useSpeechRecognition();

  // Update note text with transcript
  useEffect(() => {
    if (transcript) {
      setNewNoteText(prev => prev + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Show speech errors
  useEffect(() => {
    if (speechError) {
      toast.error(speechError);
    }
  }, [speechError]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;

    if (isListening) stopListening();

    setIsAdding(true);
    try {
      await addNote({
        location_id: locationId,
        floor: newNoteFloor,
        note_text: newNoteText,
      });
      setNewNoteText('');
      setShowAddForm(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
    }
  };

  // Generate floor options
  const floorOptions = Array.from({ length: totalFloors }, (_, i) => i + 1);

  // Get displayed text (including interim transcript)
  const displayedNoteText = newNoteText + (isListening ? interimTranscript : '');

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Walk-Through Notes
            </CardTitle>
            <CardDescription>Notes captured during site walk-throughs</CardDescription>
          </div>
          <Select
            value={selectedFloor}
            onValueChange={setSelectedFloor}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Floors</SelectItem>
              {floorOptions.map((floor) => (
                <SelectItem key={floor} value={floor.toString()}>
                  Floor {floor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAddForm ? (
          <div className="space-y-3 p-3 border border-border rounded-lg">
            <div className="relative">
              <Textarea
                placeholder="Add a walk-through note..."
                value={displayedNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="min-h-[80px] text-sm pr-10"
              />
              {isSupported && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`absolute right-1 top-1 h-8 w-8 p-0 ${isListening ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}
                  onClick={handleToggleListening}
                  title={isListening ? 'Stop recording' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {isListening && (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
                </span>
                Listening...
              </div>
            )}
            <div className="flex items-center gap-2">
              <Select
                value={newNoteFloor.toString()}
                onValueChange={(value) => setNewNoteFloor(parseInt(value))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Floor" />
                </SelectTrigger>
                <SelectContent>
                  {floorOptions.map((floor) => (
                    <SelectItem key={floor} value={floor.toString()}>
                      Floor {floor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (isListening) stopListening();
                  setShowAddForm(false);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!newNoteText.trim() || isAdding}
              >
                Add Note
              </Button>
            </div>
          </div>
        ) : null}

        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {loading ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Loading notes...
              </div>
            ) : notes.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No walk-through notes yet.
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 bg-muted rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-xs">
                      Floor {note.floor}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-foreground">{note.note_text}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {!showAddForm && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Walk-Through Note
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
