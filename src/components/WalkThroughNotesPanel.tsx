import { useState } from 'react';
import { FileText, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useWalkThroughNotes } from '@/hooks/useWalkThroughNotes';
import { format } from 'date-fns';

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

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;

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
    setEditingNoteId(noteId);
    setEditNoteText(noteText || '');
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editNoteText.trim()) return;
    
    try {
      await updateNote(noteId, { note_text: editNoteText.trim() });
      setEditingNoteId(null);
      setEditNoteText('');
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditNoteText('');
  };

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
          <Textarea
            placeholder="Add a quick note during walk-through..."
            value={newNoteText}
            onChange={(e) => setNewNoteText(e.target.value)}
            className="min-h-[60px] text-sm"
          />
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
                      <Textarea
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                        className="min-h-[60px] text-sm"
                        autoFocus
                      />
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