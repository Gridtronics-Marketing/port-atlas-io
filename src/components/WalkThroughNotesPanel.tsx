import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Pencil, Check, X, Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWalkThroughNotes } from '@/hooks/useWalkThroughNotes';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface WalkThroughNotesPanelProps {
  locationId: string;
  floor: number;
}

export const WalkThroughNotesPanel = ({ locationId, floor }: WalkThroughNotesPanelProps) => {
  const { notes, loading, addNote, updateNote, deleteNote } = useWalkThroughNotes(locationId, floor);
  const [newNoteText, setNewNoteText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');

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
      if (editingNoteId) {
        setEditNoteText(prev => prev + transcript);
      } else {
        setNewNoteText(prev => prev + transcript);
      }
      resetTranscript();
    }
  }, [transcript, editingNoteId, resetTranscript]);

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
        floor,
        note_text: newNoteText,
      });
      setNewNoteText('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
    }
  };

  const handleEditClick = (noteId: string, noteText: string) => {
    if (isListening) stopListening();
    setEditingNoteId(noteId);
    setEditNoteText(noteText || '');
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editNoteText.trim()) return;
    
    if (isListening) stopListening();
    
    try {
      await updateNote(noteId, { note_text: editNoteText.trim() });
      setEditingNoteId(null);
      setEditNoteText('');
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleCancelEdit = () => {
    if (isListening) stopListening();
    setEditingNoteId(null);
    setEditNoteText('');
  };

  // Get displayed text (including interim transcript)
  const displayedNewNoteText = editingNoteId 
    ? newNoteText 
    : newNoteText + (isListening ? interimTranscript : '');
  
  const displayedEditNoteText = editingNoteId 
    ? editNoteText + (isListening ? interimTranscript : '') 
    : editNoteText;

  return (
    <Card className="fixed bottom-4 right-4 w-80 shadow-lg z-40">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Walk-Through Notes
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Add Note Form */}
        <div className="space-y-2">
          <div className="relative">
            <Textarea
              placeholder="Add a quick note during walk-through..."
              value={displayedNewNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="min-h-[60px] text-sm pr-10"
            />
            {isSupported && !editingNoteId && (
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
          {isListening && !editingNoteId && (
            <div className="flex items-center gap-2 text-xs text-destructive">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              </span>
              Listening...
            </div>
          )}
          <Button
            onClick={handleAddNote}
            disabled={!newNoteText.trim() || isAdding}
            size="sm"
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Note
          </Button>
        </div>

        {/* Notes List */}
        <ScrollArea className="h-[200px]">
          <div className="space-y-2">
            {loading ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                Loading notes...
              </div>
            ) : notes.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                No notes yet. Add your first walk-through note above.
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-2 bg-muted rounded-md text-xs space-y-1"
                >
                  {editingNoteId === note.id ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <Textarea
                          value={displayedEditNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          className="min-h-[60px] text-sm pr-10"
                          autoFocus
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
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => handleSaveEdit(note.id)}
                          disabled={!editNoteText.trim()}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-foreground">{note.note_text}</p>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[10px]">
                          {format(new Date(note.created_at), 'MMM d, h:mm a')}
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => handleEditClick(note.id, note.note_text || '')}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
