import { useState } from 'react';
import { AlertCircle, CheckCircle, Clock, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCustomerNotes, type CustomerNote } from '@/hooks/useCustomerNotes';
import { format } from 'date-fns';

interface CustomerNotesPanelProps {
  locationId: string;
}

const priorityConfig = {
  low: { label: 'Low', color: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', color: 'bg-secondary text-secondary-foreground' },
  high: { label: 'High', color: 'bg-warning text-warning-foreground' },
  urgent: { label: 'Urgent', color: 'bg-destructive text-destructive-foreground' },
};

const statusConfig = {
  open: { label: 'Open', icon: Clock, color: 'text-warning' },
  acknowledged: { label: 'Acknowledged', icon: AlertCircle, color: 'text-primary' },
  resolved: { label: 'Resolved', icon: CheckCircle, color: 'text-success' },
};

export const CustomerNotesPanel = ({ locationId }: CustomerNotesPanelProps) => {
  const { notes, loading, addNote, updateNoteStatus, deleteNote } = useCustomerNotes(locationId);
  const [newNoteText, setNewNoteText] = useState('');
  const [newNotePriority, setNewNotePriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;

    setIsAdding(true);
    try {
      await addNote({
        location_id: locationId,
        note_text: newNoteText,
        priority: newNotePriority,
      });
      setNewNoteText('');
      setNewNotePriority('normal');
      setShowAddForm(false);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this customer note?')) {
      await deleteNote(noteId);
    }
  };

  const renderNote = (note: CustomerNote) => {
    const StatusIcon = statusConfig[note.status].icon;
    
    return (
      <div
        key={note.id}
        className="p-3 bg-muted rounded-lg space-y-2"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <StatusIcon className={`h-4 w-4 ${statusConfig[note.status].color}`} />
            <Badge className={priorityConfig[note.priority].color}>
              {priorityConfig[note.priority].label}
            </Badge>
          </div>
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
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}</span>
          
          {note.status !== 'resolved' && (
            <Select
              value={note.status}
              onValueChange={(value: 'open' | 'acknowledged' | 'resolved') => 
                updateNoteStatus(note.id, value)
              }
            >
              <SelectTrigger className="h-6 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        {note.acknowledged_at && (
          <p className="text-xs text-muted-foreground">
            {note.status === 'resolved' ? 'Resolved' : 'Acknowledged'}: {format(new Date(note.acknowledged_at), 'MMM d, h:mm a')}
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Customer Notes</CardTitle>
        <CardDescription>Notes from customers assigned to this location</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAddForm ? (
          <div className="space-y-3 p-3 border border-border rounded-lg">
            <Textarea
              placeholder="Enter customer note..."
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              className="min-h-[80px] text-sm"
            />
            <div className="flex items-center gap-2">
              <Select
                value={newNotePriority}
                onValueChange={(value: 'low' | 'normal' | 'high' | 'urgent') => 
                  setNewNotePriority(value)
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
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
                Loading customer notes...
              </div>
            ) : notes.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No customer notes yet.
              </div>
            ) : (
              notes.map(renderNote)
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
            Add Customer Note
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
